extends Node
class_name DiceManager

const DiceBid = preload("res://Scripts/dice_bid.gd")
const PlayerController = preload("res://Scripts/player_controller.gd")

@export var dice_per_player: int = 5

var _player_dice: Dictionary = {}

func _ready():
	randomize()

func prepare_new_round(players: Array) -> void:
	_player_dice.clear()
	for player in players:
		if not (player is PlayerController):
			continue
		if not player.is_alive:
			continue
		var dice_values := PackedInt32Array()
		for i in range(dice_per_player):
			dice_values.append(randi_range(1, 6))
		_player_dice[player] = dice_values

func peek_dice(player: PlayerController) -> PackedInt32Array:
	return _player_dice.get(player, PackedInt32Array())

func generate_raise(player: PlayerController, previous_bid: DiceBid) -> DiceBid:
	var bid: DiceBid = previous_bid.duplicate() if previous_bid != null else DiceBid.new()
	var increase_quantity := randf() > 0.5

	if previous_bid == null or previous_bid.is_empty():
		var dice := peek_dice(player)
		var face := dice[randi() % dice.size()] if dice.size() > 0 else randi_range(1, 6)
		var quantity := max(1, _count_face(dice, face))
		bid = DiceBid.new(quantity, face)
		return ensure_legal_raise(bid, previous_bid)

	if increase_quantity:
		bid.quantity += 1
	else:
		bid.face_value += 1

	return ensure_legal_raise(bid, previous_bid)

func ensure_legal_raise(candidate: DiceBid, previous_bid: DiceBid) -> DiceBid:
	var max_dice := dice_per_player * max(1, _player_dice.size())
	candidate.clamp(max_dice)

	if previous_bid == null or previous_bid.is_empty():
		return candidate

	if candidate.quantity < previous_bid.quantity:
		candidate.quantity = previous_bid.quantity

	if candidate.quantity == previous_bid.quantity and candidate.face_value <= previous_bid.face_value:
		if candidate.face_value < 6:
			candidate.face_value = min(6, previous_bid.face_value + 1)
		else:
			candidate.face_value = previous_bid.face_value
			candidate.quantity = min(max_dice, previous_bid.quantity + 1)

	if candidate.quantity == previous_bid.quantity and candidate.face_value <= previous_bid.face_value:
		candidate.quantity = min(max_dice, previous_bid.quantity + 1)
		candidate.face_value = previous_bid.face_value

	return candidate

func validate_bid(bid: DiceBid) -> bool:
	var matching_dice := 0
	for dice_values in _player_dice.values():
		for value in dice_values:
			if value == bid.face_value:
				matching_dice += 1
	return matching_dice >= bid.quantity

func reveal_dice() -> Dictionary:
	var copy := {}
	for player in _player_dice.keys():
		copy[player] = _player_dice[player].duplicate()
	return copy

func get_total_active_dice() -> int:
	var total := 0
	for dice_values in _player_dice.values():
		total += dice_values.size()
	return total

func _count_face(dice_values: PackedInt32Array, face: int) -> int:
	var count := 0
	for value in dice_values:
		if value == face:
			count += 1
	return count
