extends Node
class_name GameManager

const GameEnums = preload("res://Scripts/game_enums.gd")
const PlayerController = preload("res://Scripts/player_controller.gd")
const CardManager = preload("res://Scripts/card_manager.gd")
const DiceManager = preload("res://Scripts/dice_manager.gd")
const BluffSystem = preload("res://Scripts/bluff_system.gd")
const RussianRoulette = preload("res://Scripts/russian_roulette.gd")
const DiceBid = preload("res://Scripts/dice_bid.gd")
const CardData = preload("res://Scripts/card_data.gd")

@export var card_manager_path: NodePath = NodePath("CardManager")
@export var dice_manager_path: NodePath = NodePath("DiceManager")
@export var bluff_system_path: NodePath = NodePath("BluffSystem")
@export var russian_roulette_path: NodePath = NodePath("RussianRoulette")

@export var bluff_button_path: NodePath = NodePath("../UI/Panel/Layout/Buttons/BluffButton")
@export var call_button_path: NodePath = NodePath("../UI/Panel/Layout/Buttons/CallButton")
@export var raise_button_path: NodePath = NodePath("../UI/Panel/Layout/Buttons/RaiseButton")
@export var drink_button_path: NodePath = NodePath("../UI/Panel/Layout/Buttons/DrinkButton")

@export var status_label_path: NodePath = NodePath("../UI/Panel/Layout/Status")
@export var mode_label_path: NodePath = NodePath("../UI/Panel/Layout/Mode")
@export var scoreboard_label_path: NodePath = NodePath("../UI/Panel/Layout/Scoreboard")
@export var log_label_path: NodePath = NodePath("../UI/Panel/Layout/Timeline")

@export var reveal_truth_debug: bool = true
@export var auto_start: bool = true
@export var default_player_names: PackedStringArray = ["Ada", "Bruno", "Cass"]
@export var rotate_modes_each_round: bool = true
@export var human_player_name: String = "You"
@export var spawn_local_player: bool = true
@export var bot_turn_delay_range: Vector2 = Vector2(0.7, 1.4)

var players: Array = []
var active_player_index: int = -1
var active_mode: int = GameEnums.GameMode.CARD_BLUFF
var phase: int = GameEnums.GamePhase.LOBBY

var card_manager: CardManager
var dice_manager: DiceManager
var bluff_system: BluffSystem
var russian_roulette: RussianRoulette

var bluff_button: Button
var call_button: Button
var raise_button: Button
var drink_button: Button

var status_label: Label
var mode_label: Label
var scoreboard_label: RichTextLabel
var log_label: RichTextLabel

const HISTORY_MAX = 8
var status_history: Array = []
var _bot_turn_ticket: int = 0

func _ready():
	randomize()
	card_manager = get_node_or_null(card_manager_path)
	dice_manager = get_node_or_null(dice_manager_path)
	bluff_system = get_node_or_null(bluff_system_path)
	russian_roulette = get_node_or_null(russian_roulette_path)

	bluff_button = get_node_or_null(bluff_button_path)
	call_button = get_node_or_null(call_button_path)
	raise_button = get_node_or_null(raise_button_path)
	drink_button = get_node_or_null(drink_button_path)

	status_label = get_node_or_null(status_label_path)
	mode_label = get_node_or_null(mode_label_path)
	scoreboard_label = get_node_or_null(scoreboard_label_path)
	log_label = get_node_or_null(log_label_path)

	_wire_button_callbacks()
	update_mode_label()
	update_status("Waiting for players...")
	configure_ui(false)
	refresh_scoreboard()

	if auto_start:
		_ensure_demo_players()
		begin_match(active_mode)

func inject_ui_references(bluff: Button, call: Button, raise: Button, drink: Button, status: Label, mode: Label, scoreboard: RichTextLabel, timeline: RichTextLabel = null) -> void:
	_assign_button_field("bluff_button", bluff, Callable(self, "on_bluff_button_pressed"))
	_assign_button_field("call_button", call, Callable(self, "on_call_button_pressed"))
	_assign_button_field("raise_button", raise, Callable(self, "on_raise_button_pressed"))
	_assign_button_field("drink_button", drink, Callable(self, "on_drink_button_pressed"))

	status_label = status
	mode_label = mode
	scoreboard_label = scoreboard
	log_label = timeline if timeline else get_node_or_null(log_label_path)

	_wire_button_callbacks()
	configure_ui_for_mode()
	refresh_scoreboard()

func set_truth_debug(enabled: bool) -> void:
	reveal_truth_debug = enabled

func begin_match(selected_mode: int) -> void:
	if players.is_empty():
		update_status("No players registered.")
		return

	active_mode = selected_mode
	phase = GameEnums.GamePhase.ROUND_INTRO
	configure_ui_for_mode()
	configure_ui(false)
	update_mode_label()

	match active_mode:
		GameEnums.GameMode.CARD_BLUFF:
			bluff_system.begin_card_round(players)
		GameEnums.GameMode.DICE_BLUFF:
			bluff_system.begin_dice_round(players)

	phase = GameEnums.GamePhase.PLAYER_TURN
	active_player_index = find_next_alive_index(-1)
	_bot_turn_ticket += 1
	_prepare_turn()

func register_player(controller: PlayerController) -> void:
	if controller == null or players.has(controller):
		return
	players.append(controller)
	controller.player_died.connect(Callable(self, "_on_player_death"))
	controller.play_idle()
	refresh_scoreboard()

func unregister_player(controller: PlayerController) -> void:
	if controller == null:
		return
	if players.erase(controller):
		if controller.player_died.is_connected(Callable(self, "_on_player_death")):
			controller.player_died.disconnect(Callable(self, "_on_player_death"))
		if players.is_empty():
			phase = GameEnums.GamePhase.LOBBY
			update_status("Waiting for players...")
		refresh_scoreboard()

func on_bluff_button_pressed() -> void:
	var player := get_current_player()
	if player == null:
		return
	match active_mode:
		GameEnums.GameMode.CARD_BLUFF:
			var result := bluff_system.generate_card_claim(player)
			var claim: CardData = result["card"]
			var tells_truth: bool = result["tells_truth"]
			bluff_system.submit_card_claim(player, claim)
			var card_message := "%s makes a claim." % player.display_name
			if reveal_truth_debug:
				card_message = "%s declares a %s. Truth: %s" % [player.display_name, claim.rank, str(tells_truth)]
			update_status(card_message)
		GameEnums.GameMode.DICE_BLUFF:
			var result := bluff_system.generate_dice_claim(player, bluff_system.current_dice_bid)
			var bid: DiceBid = result["bid"]
			var tells_truth: bool = result["tells_truth"]
			bluff_system.submit_dice_bid(player, bid)
			var dice_message := "%s raises the stakes." % player.display_name
			if reveal_truth_debug:
				dice_message = "%s bids %s. Truth: %s" % [player.display_name, bid, str(tells_truth)]
			update_status(dice_message)
	refresh_scoreboard()
	advance_turn()

func on_call_button_pressed() -> void:
	var challenger := get_current_player()
	if challenger == null or bluff_system.last_claim_owner == null:
		return

	var claim_was_true := bluff_system.resolve_call(challenger)

	if not claim_was_true and active_mode == GameEnums.GameMode.CARD_BLUFF:
		phase = GameEnums.GamePhase.MINIGAME
		update_status("%s caught %s! Russian Roulette..." % [challenger.display_name, bluff_system.last_claim_owner.display_name])
		configure_ui(false)
		_bot_turn_ticket += 1
		russian_roulette.play_sequence(bluff_system.last_liar, Callable(self, "_on_russian_roulette_finished"))
		return

	var affected_player := challenger if claim_was_true else bluff_system.last_claim_owner
	update_status(claim_was_true
		? "%s challenged incorrectly!" % challenger.display_name
		: "%s exposes %s!" % [challenger.display_name, bluff_system.last_claim_owner.display_name])

	handle_resolution(affected_player)

func on_raise_button_pressed() -> void:
	if active_mode != GameEnums.GameMode.DICE_BLUFF:
		return
	var player := get_current_player()
	if player == null:
		return
	var result := bluff_system.generate_dice_claim(player, bluff_system.current_dice_bid)
	var bid: DiceBid = result["bid"]
	var tells_truth: bool = result["tells_truth"]
	bluff_system.submit_dice_bid(player, bid)
	var raise_message := "%s sweetens the bluff." % player.display_name
	if reveal_truth_debug:
		raise_message = "%s raises to %s. Truth: %s" % [player.display_name, bid, str(tells_truth)]
	update_status(raise_message)
	refresh_scoreboard()
	advance_turn()

func on_drink_button_pressed() -> void:
	var player := get_current_player()
	if player == null:
		return
	player.drink_poison()
	check_for_eliminations()
	refresh_scoreboard()
	advance_turn()

func _on_russian_roulette_finished(unlucky_player: PlayerController, survived: bool) -> void:
	phase = GameEnums.GamePhase.RESOLUTION
	if not survived and unlucky_player != null:
		unlucky_player.kill_player("Russian Roulette")
	update_status(survived ? "Click... they live." : "Bang! %s is out." % unlucky_player.display_name)
	handle_resolution(unlucky_player)

func handle_resolution(affected_player: PlayerController) -> void:
	phase = GameEnums.GamePhase.RESOLUTION
	_bot_turn_ticket += 1
	configure_ui(false)

	if active_mode == GameEnums.GameMode.DICE_BLUFF and affected_player != null and affected_player.is_alive:
		affected_player.drink_poison()

	check_for_eliminations()
	refresh_scoreboard()

	var outcome := try_declare_winner()
	if outcome["has_winner"]:
		phase = GameEnums.GamePhase.GAME_OVER
		configure_ui(false)
		var winner: PlayerController = outcome["winner"]
		update_status(winner != null ? "%s wins!" % winner.display_name : "All patrons perished.")
		return

	for player in players:
		if player.is_alive:
			player.increment_round_survival()

	var next_mode := active_mode
	if rotate_modes_each_round:
		next_mode = _get_next_mode(active_mode)

	begin_match(next_mode)

func check_for_eliminations() -> void:
	for player in players:
		if not player.is_alive:
			continue
		if player.poison_drinks >= 2:
			player.kill_player("Poison")

func try_declare_winner() -> Dictionary:
	var winner: PlayerController = null
	var alive_count := 0
	for player in players:
		if not player.is_alive:
			continue
		alive_count += 1
		winner = player
	if alive_count <= 1:
		return {"has_winner": true, "winner": winner}
	return {"has_winner": false, "winner": null}

func advance_turn() -> void:
	_bot_turn_ticket += 1
	phase = GameEnums.GamePhase.PLAYER_TURN
	active_player_index = find_next_alive_index(active_player_index)
	if active_player_index == -1:
		var outcome := try_declare_winner()
		if outcome["has_winner"]:
			phase = GameEnums.GamePhase.GAME_OVER
			configure_ui(false)
			var winner: PlayerController = outcome["winner"]
			update_status(winner != null ? "%s wins!" % winner.display_name : "No survivors remain.")
		return
	_prepare_turn()

func find_next_alive_index(start_index: int) -> int:
	if players.is_empty():
		return -1
	for offset in range(1, players.size() + 1):
		var candidate := (start_index + offset + players.size()) % players.size()
		var controller: PlayerController = players[candidate]
		if controller.is_alive:
			return candidate
	return -1

func get_current_player() -> PlayerController:
	if players.is_empty():
		return null
	if active_player_index < 0 or active_player_index >= players.size():
		active_player_index = find_next_alive_index(active_player_index)
	if active_player_index == -1:
		return null
	var candidate: PlayerController = players[active_player_index]
	return candidate if candidate.is_alive else null

func update_turn_status() -> void:
	var player := get_current_player()
	if player == null:
		update_status("All players eliminated or missing.")
		return
	var status_text := "Your move—decide whether to bluff, call, or raise." if player.is_human else "%s weighs their options..." % player.display_name
	update_status(status_text)

func _prepare_turn() -> void:
	if phase != GameEnums.GamePhase.PLAYER_TURN:
		configure_ui(false)
		return
	var player := get_current_player()
	if player == null:
		configure_ui(false)
		update_status("All players eliminated or missing.")
		return
	var is_human_turn := player.is_human
	configure_ui(is_human_turn)
	_apply_contextual_button_rules(player)
	update_turn_status()
	refresh_scoreboard()
	if not is_human_turn:
		_schedule_bot_turn(player)

func _apply_contextual_button_rules(player: PlayerController) -> void:
	if bluff_system == null:
		return
	if call_button:
		var can_call := player.is_human and bluff_system.has_active_claim() and bluff_system.last_claim_owner != player
		call_button.disabled = not can_call
	if raise_button:
		var has_bid := not bluff_system.get_current_dice_bid().is_empty()
		var can_raise := player.is_human and active_mode == GameEnums.GameMode.DICE_BLUFF and has_bid
		raise_button.disabled = not can_raise
	if bluff_button:
		bluff_button.disabled = not player.is_human
	if drink_button:
		var can_drink := player.is_human and active_mode == GameEnums.GameMode.DICE_BLUFF
		drink_button.disabled = not can_drink

func configure_ui(interactable: bool) -> void:
	_set_button_state(bluff_button, interactable)
	_set_button_state(call_button, interactable)
	_set_button_state(raise_button, interactable)
	_set_button_state(drink_button, interactable)
	configure_ui_for_mode()

func configure_ui_for_mode() -> void:
	var playing_dice := active_mode == GameEnums.GameMode.DICE_BLUFF
	if raise_button:
		raise_button.visible = playing_dice
	if drink_button:
		drink_button.visible = playing_dice

func _set_button_state(button: Button, interactable: bool) -> void:
	if button == null:
		return
	button.disabled = not interactable
	button.visible = true

func _schedule_bot_turn(player: PlayerController) -> void:
	_bot_turn_ticket += 1
	var ticket := _bot_turn_ticket
	var min_delay := min(bot_turn_delay_range.x, bot_turn_delay_range.y)
	var max_delay := max(bot_turn_delay_range.x, bot_turn_delay_range.y)
	var wait_time := randf_range(min_delay, max_delay)
	wait_time = max(0.1, wait_time)
	var timer := get_tree().create_timer(wait_time)
	timer.timeout.connect(Callable(self, "_on_bot_timer_fired").bind(ticket, player), Object.CONNECT_ONE_SHOT)

func _on_bot_timer_fired(ticket: int, player: PlayerController) -> void:
	if ticket != _bot_turn_ticket:
		return
	if phase != GameEnums.GamePhase.PLAYER_TURN:
		return
	if player == null or get_current_player() != player or player.is_human:
		return
	_perform_bot_action(player)

func _perform_bot_action(bot: PlayerController) -> void:
	if bot == null or bluff_system == null:
		return
	var can_call := bluff_system.has_active_claim() and bluff_system.last_claim_owner != null and bluff_system.last_claim_owner != bot
	if can_call:
		var should_call := false
		if active_mode == GameEnums.GameMode.CARD_BLUFF:
			should_call = _bot_should_call_card(bot)
		else:
			should_call = _bot_should_call_dice(bot)
		if should_call:
			on_call_button_pressed()
			return
	if active_mode == GameEnums.GameMode.DICE_BLUFF and not bluff_system.get_current_dice_bid().is_empty():
		if _bot_should_raise(bot):
			on_raise_button_pressed()
			return
	on_bluff_button_pressed()

func _bot_should_call_card(bot: PlayerController) -> bool:
	var truth := bluff_system.is_last_claim_truthful()
	var skepticism := clamp(bot.bot_skepticism, 0.0, 1.0)
	var call_chance := truth ? lerp(0.05, 0.35, skepticism) : lerp(0.45, 0.9, skepticism)
	return randf() < call_chance

func _bot_should_call_dice(bot: PlayerController) -> bool:
	if dice_manager == null:
		return false
	var current_bid := bluff_system.get_current_dice_bid()
	if current_bid == null or current_bid.is_empty():
		return false
	var dice := dice_manager.peek_dice(bot)
	var known := 0
	for value in dice:
		if value == current_bid.face_value:
			known += 1
	var total_dice := dice_manager.get_total_active_dice()
	var unseen := max(total_dice - dice.size(), 0)
	var expected := float(unseen) / 6.0 + float(known)
	var skepticism := clamp(bot.bot_skepticism, 0.0, 1.0)
	var buffer := lerp(0.4, 1.6, skepticism)
	if not bluff_system.is_last_claim_truthful():
		buffer -= 0.25
	return expected + buffer < float(current_bid.quantity)

func _bot_should_raise(bot: PlayerController) -> bool:
	if dice_manager == null:
		return false
	var aggression := clamp(bot.bot_aggression, 0.0, 1.0)
	var base := lerp(0.1, 0.65, aggression)
	if not bluff_system.is_last_claim_truthful():
		base *= 0.7
	return randf() < base

func update_status(message: String) -> void:
	if status_label:
		status_label.text = message
	else:
		print(message)
	_record_status_event(message)

func update_mode_label() -> void:
	if mode_label:
		var mode_name := "Card Bluff"
		var tagline := "Read the tells and catch the lies."
		if active_mode == GameEnums.GameMode.DICE_BLUFF:
			mode_name = "Dice Bluff"
			tagline = "Bid boldly with hidden dice."
		var next_line := ""
		if rotate_modes_each_round:
			var upcoming_mode := _get_next_mode(active_mode)
			var upcoming_name := "Card Bluff" if upcoming_mode == GameEnums.GameMode.CARD_BLUFF else "Dice Bluff"
			next_line = "\nNext up: %s" % upcoming_name
		mode_label.text = "Mode: %s\n%s%s" % [mode_name, tagline, next_line]

func refresh_scoreboard() -> void:
	if scoreboard_label == null:
		return
	var lines: Array = []
	const max_poison := 2
	var ordered_players := players.duplicate()
	ordered_players.sort_custom(Callable(self, "_sort_players_for_scoreboard"))
	for player in ordered_players:
		var state_color := "#75f5ac" if player.is_alive else "#ff6a6a"
		var poison_tokens := "█".repeat(min(player.poison_drinks, max_poison))
		var safe_tokens := "·".repeat(max(max_poison - player.poison_drinks, 0))
		var poison_meter := "[color=#ffb347]%s[/color][color=#4c556a]%s[/color]" % [poison_tokens, safe_tokens]
		var role_tag := "[color=#ffd166][You][/color]" if player.is_human else "[color=#8899ff][Bot][/color]"
		lines.append("[b]%s[/b] %s [color=%s]%s[/color]  •  Poison: %s (%d)  •  Rounds: %d  •  Mood: [i]%s[/i]" % [
			player.display_name,
			role_tag,
			state_color,
			"ALIVE" if player.is_alive else "DEAD",
			poison_meter,
			player.poison_drinks,
			player.rounds_survived,
			player.current_emote
		])
	if lines.is_empty():
		scoreboard_label.bbcode_text = "No patrons seated."
	else:
		scoreboard_label.bbcode_text = "\n".join(lines)

func _sort_players_for_scoreboard(a: PlayerController, b: PlayerController) -> bool:
	if a.is_human != b.is_human:
		return a.is_human
	if a.is_alive != b.is_alive:
		return a.is_alive
	if a.rounds_survived == b.rounds_survived:
		return a.display_name < b.display_name
	return a.rounds_survived > b.rounds_survived

func _get_next_mode(current_mode: int) -> int:
	return GameEnums.GameMode.DICE_BLUFF if current_mode == GameEnums.GameMode.CARD_BLUFF else GameEnums.GameMode.CARD_BLUFF

func _record_status_event(message: String) -> void:
	var time_data := Time.get_time_dict_from_system()
	var hour := int(time_data.get("hour", 0))
	var minute := int(time_data.get("minute", 0))
	var second := int(time_data.get("second", 0))
	var stamp := "%02d:%02d:%02d" % [hour, minute, second]
	var entry := "[color=#6fb3ff][%s][/color] %s" % [stamp, message]
	status_history.append(entry)
	if status_history.size() > HISTORY_MAX:
		status_history.remove_at(0)
	if log_label:
		var ordered := status_history.duplicate()
		ordered.reverse()
		log_label.bbcode_text = "\n".join(ordered)

func _on_player_death(player: PlayerController) -> void:
	if players.find(player) == active_player_index:
		active_player_index = find_next_alive_index(active_player_index)
	refresh_scoreboard()

func _wire_button_callbacks() -> void:
	_assign_listener(bluff_button, Callable(self, "on_bluff_button_pressed"))
	_assign_listener(call_button, Callable(self, "on_call_button_pressed"))
	_assign_listener(raise_button, Callable(self, "on_raise_button_pressed"))
	_assign_listener(drink_button, Callable(self, "on_drink_button_pressed"))

func _assign_listener(button: Button, callable: Callable) -> void:
	if button == null or callable.is_null():
		return
	if button.pressed.is_connected(callable):
		button.pressed.disconnect(callable)
	button.pressed.connect(callable)

func _assign_button_field(field_name: String, incoming: Button, callable: Callable) -> void:
	var current: Button = get(field_name)
	if current and not callable.is_null():
		if current.pressed.is_connected(callable):
			current.pressed.disconnect(callable)
	set(field_name, incoming)
	if incoming and not callable.is_null():
		if incoming.pressed.is_connected(callable):
			incoming.pressed.disconnect(callable)
		incoming.pressed.connect(callable)

func _ensure_demo_players() -> void:
	if not players.is_empty():
		return
	if spawn_local_player:
		var local_player := PlayerController.new()
		local_player.display_name = human_player_name
		local_player.is_human = true
		add_child(local_player)
		register_player(local_player)

	for name in default_player_names:
		var bot := PlayerController.new()
		bot.display_name = name
		bot.set_bot_profile(randf_range(0.35, 0.85), randf_range(0.25, 0.85))
		add_child(bot)
		register_player(bot)

	if players.size() < 2:
		var fallback := PlayerController.new()
		fallback.display_name = "Bot %d" % players.size()
		fallback.set_bot_profile(randf_range(0.35, 0.85), randf_range(0.25, 0.85))
		add_child(fallback)
		register_player(fallback)
