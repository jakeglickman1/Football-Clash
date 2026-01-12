extends Node
class_name BluffSystem

const GameEnums = preload("res://Scripts/game_enums.gd")
const CardManager = preload("res://Scripts/card_manager.gd")
const DiceManager = preload("res://Scripts/dice_manager.gd")
const PlayerController = preload("res://Scripts/player_controller.gd")
const CardData = preload("res://Scripts/card_data.gd")
const DiceBid = preload("res://Scripts/dice_bid.gd")

@export_range(0.0, 1.0) var lie_bias: float = 0.4
@export var card_manager_path: NodePath
@export var dice_manager_path: NodePath

var last_claim_owner: PlayerController
var last_liar: PlayerController
var current_card_claim: CardData = CardData.new()
var current_dice_bid: DiceBid = DiceBid.new()
var current_mode: int = GameEnums.GameMode.CARD_BLUFF

var _last_claim_truth: bool = true

var _card_manager: CardManager
var _dice_manager: DiceManager

func _ready():
	randomize()
	_card_manager = get_node_or_null(card_manager_path)
	_dice_manager = get_node_or_null(dice_manager_path)
	reset_state()

func begin_card_round(players: Array) -> void:
	current_mode = GameEnums.GameMode.CARD_BLUFF
	reset_state()
	if _card_manager:
		_card_manager.reset_deck()
		_card_manager.deal_hands(players)
	for player in players:
		if player is PlayerController:
			player.reset_for_round()

func begin_dice_round(players: Array) -> void:
	current_mode = GameEnums.GameMode.DICE_BLUFF
	reset_state()
	if _dice_manager:
		_dice_manager.prepare_new_round(players)
	for player in players:
		if player is PlayerController:
			player.reset_for_round()

func generate_card_claim(player: PlayerController) -> Dictionary:
	if _card_manager == null:
		return {"card": CardData.new(), "tells_truth": true}
	var actual_card: CardData = _card_manager.peek_hand(player)
	var tells_truth := randf() > lie_bias
	var claimed := actual_card.duplicate() if tells_truth else _card_manager.generate_misdirection_card(actual_card)
	return {"card": claimed, "tells_truth": tells_truth}

func generate_dice_claim(player: PlayerController, previous_bid: DiceBid) -> Dictionary:
	if _dice_manager == null:
		return {"bid": DiceBid.new(), "tells_truth": true}
	var tells_truth := randf() > lie_bias
	var bid := DiceBid.new()
	if tells_truth:
		var dice := _dice_manager.peek_dice(player)
		if dice.size() == 0:
			bid = _dice_manager.generate_raise(player, previous_bid)
		else:
			var face := dice[randi() % dice.size()]
			var quantity := 0
			for value in dice:
				if value == face:
					quantity += 1
			bid = DiceBid.new(max(1, quantity), face)
			bid = _dice_manager.ensure_legal_raise(bid, previous_bid)
	else:
		bid = _dice_manager.generate_raise(player, previous_bid)
	return {"bid": bid, "tells_truth": tells_truth}

func submit_card_claim(player: PlayerController, declared_card: CardData) -> void:
	last_claim_owner = player
	current_mode = GameEnums.GameMode.CARD_BLUFF
	current_card_claim = declared_card
	if _card_manager:
		_last_claim_truth = _card_manager.verify_card_claim(player, declared_card)
	else:
		_last_claim_truth = true
	last_liar = null if _last_claim_truth else player
	player.react_to_bluff(!_last_claim_truth)
	print("%s claims: %s (truth: %s)" % [player.display_name, declared_card, str(_last_claim_truth)])

func submit_dice_bid(player: PlayerController, bid: DiceBid) -> void:
	current_mode = GameEnums.GameMode.DICE_BLUFF
	last_claim_owner = player
	if _dice_manager:
		current_dice_bid = _dice_manager.ensure_legal_raise(bid, current_dice_bid)
		_last_claim_truth = _dice_manager.validate_bid(current_dice_bid)
	else:
		current_dice_bid = bid
		_last_claim_truth = true
	last_liar = null if _last_claim_truth else player
	player.react_to_bluff(!_last_claim_truth)
	print("%s bids %s (truth: %s)" % [player.display_name, current_dice_bid, str(_last_claim_truth)])

func resolve_call(challenger: PlayerController) -> bool:
	if challenger:
		challenger.react_to_bluff(false)
	if last_claim_owner == null:
		push_warning("No claim to challenge.")
		return true
	if current_mode == GameEnums.GameMode.DICE_BLUFF and _dice_manager:
		_last_claim_truth = _dice_manager.validate_bid(current_dice_bid)
		last_liar = null if _last_claim_truth else last_claim_owner
	elif current_mode == GameEnums.GameMode.CARD_BLUFF and _card_manager:
		var actual_card := _card_manager.reveal_player_card(last_claim_owner)
		_last_claim_truth = _card_manager.verify_card_claim(last_claim_owner, current_card_claim)
		last_liar = null if _last_claim_truth else last_claim_owner
		print("Reveal: %s held %s" % [last_claim_owner.display_name, actual_card])
	return _last_claim_truth

func reset_state() -> void:
	last_claim_owner = null
	last_liar = null
	current_card_claim = CardData.new()
	current_dice_bid = DiceBid.new()
	_last_claim_truth = true

func has_active_claim() -> bool:
	return last_claim_owner != null

func is_last_claim_truthful() -> bool:
	return _last_claim_truth

func get_current_card_claim() -> CardData:
	return current_card_claim

func get_current_dice_bid() -> DiceBid:
	return current_dice_bid
