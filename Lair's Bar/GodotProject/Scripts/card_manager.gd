extends Node
class_name CardManager

const CardData = preload("res://Scripts/card_data.gd")
const PlayerController = preload("res://Scripts/player_controller.gd")

@export var ranks: PackedStringArray = ["Ace", "King", "Queen", "Jack", "Ten", "Nine"]
@export var suits: PackedStringArray = ["Hearts", "Spades", "Clubs", "Diamonds"]

var _deck: Array = []
var _player_hands: Dictionary = {}

func _ready():
	if _deck.is_empty():
		reset_deck()

func reset_deck() -> void:
	_deck.clear()
	for rank in ranks:
		for suit in suits:
			_deck.append(CardData.new(rank, suit))
	_deck.shuffle()
	_player_hands.clear()

func deal_hands(players: Array) -> void:
	for player in players:
		if not (player is PlayerController):
			continue
		if not player.is_alive:
			continue
		deal_card_to_player(player)

func deal_card_to_player(player: PlayerController) -> CardData:
	if _deck.is_empty():
		reset_deck()
	var card: CardData = _deck[0]
	_deck.remove_at(0)
	_player_hands[player] = card
	return card

func peek_hand(player: PlayerController) -> CardData:
	var card: CardData = _player_hands.get(player)
	if card == null:
		card = deal_card_to_player(player)
	return card

func verify_card_claim(player: PlayerController, claimed: CardData) -> bool:
	var actual: CardData = _player_hands.get(player)
	if actual == null:
		return false
	return actual.equals(claimed)

func reveal_player_card(player: PlayerController) -> CardData:
	return _player_hands.get(player, null)

func discard_player_card(player: PlayerController) -> void:
	if _player_hands.has(player):
		_player_hands.erase(player)

func generate_misdirection_card(real_card: CardData) -> CardData:
	var fake := real_card
	var guard := 0
	while fake.equals(real_card) and guard < 16:
		guard += 1
		fake = CardData.new(_get_random_rank(), _get_random_suit())
	return fake

func _get_random_rank() -> String:
	if ranks.is_empty():
		return "Ace"
	return ranks[randi() % ranks.size()]

func _get_random_suit() -> String:
	if suits.is_empty():
		return "Spades"
	return suits[randi() % suits.size()]
