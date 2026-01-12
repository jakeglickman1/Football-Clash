extends Node
class_name RussianRoulette

signal sequence_finished(target: PlayerController, survived: bool)

@export var spin_duration: float = 2.0
@export var pause_before_shot: float = 1.0
@export var audio_player_path: NodePath
@export var spin_clip: AudioStream
@export var shot_clip: AudioStream
@export var click_clip: AudioStream

const PlayerController = preload("res://Scripts/player_controller.gd")

var _audio_player: AudioStreamPlayer

func _ready():
	_audio_player = get_node_or_null(audio_player_path)
	randomize()

func play_sequence(target: PlayerController, on_complete: Callable = Callable()) -> void:
	if target == null:
		push_warning("No target for Russian Roulette")
		if on_complete.is_valid():
			on_complete.call(null, true)
		emit_signal("sequence_finished", null, true)
		return
		call_deferred("_run_roulette", target, on_complete)

func _run_roulette(target: PlayerController, on_complete: Callable) -> void:
	_play_sfx(spin_clip)
	await get_tree().create_timer(spin_duration).timeout
	target.react_to_bluff(true)
	await get_tree().create_timer(pause_before_shot).timeout
	var survived := _evaluate_shot()
	_play_sfx(click_clip if survived else shot_clip)
	if on_complete.is_valid():
		on_complete.call(target, survived)
	emit_signal("sequence_finished", target, survived)

func _evaluate_shot() -> bool:
	var live_chamber := randi_range(0, 5)
	var fired_chamber := randi_range(0, 5)
	return live_chamber != fired_chamber

func _play_sfx(stream: AudioStream) -> void:
	if _audio_player == null or stream == null:
		return
	_audio_player.stream = stream
	_audio_player.play()
