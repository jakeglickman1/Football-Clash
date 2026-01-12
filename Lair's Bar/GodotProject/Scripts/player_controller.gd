extends Node
class_name PlayerController

signal player_died(player: PlayerController)

var display_name: String = "Player"
var character_id: String = "default"
var is_alive: bool = true
var poison_drinks: int = 0
var rounds_survived: int = 0
var network_id: String = ""
var current_emote: String = "Calm"
var is_human: bool = false
var bot_aggression: float = 0.5
var bot_skepticism: float = 0.5

func _ready():
	network_id = "player-%s" % str(randi())

func initialize(name_override: String, assigned_character: String) -> void:
	if name_override.strip_edges() != "":
		display_name = name_override
	if assigned_character.strip_edges() != "":
		character_id = assigned_character

func play_idle() -> void:
	pass

func react_to_bluff(is_liar: bool) -> void:
	if not is_alive:
		current_emote = "Silent"
		return
	current_emote = "Sweating" if is_liar else "Confident"

func drink_poison() -> void:
	if not is_alive:
		return
	poison_drinks += 1
	current_emote = "Reeling" if poison_drinks > 0 else current_emote

func increment_round_survival() -> void:
	rounds_survived += 1

func kill_player(reason: String) -> void:
	if not is_alive:
		return
	is_alive = false
	current_emote = "Fallen"
	print("%s eliminated via %s" % [display_name, reason])
	emit_signal("player_died", self)

func revive() -> void:
	is_alive = true
	poison_drinks = 0
	rounds_survived = 0
	current_emote = "Reborn"

func reset_for_round() -> void:
	if not is_alive:
		return
	current_emote = "Focused"

func set_bot_profile(aggression: float, skepticism: float) -> void:
	bot_aggression = clamp(aggression, 0.0, 1.0)
	bot_skepticism = clamp(skepticism, 0.0, 1.0)
