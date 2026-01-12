extends RefCounted
class_name GameEnums

enum GameMode {
	CARD_BLUFF,
	DICE_BLUFF
}

enum GamePhase {
	LOBBY,
	ROUND_INTRO,
	PLAYER_TURN,
	RESOLUTION,
	MINIGAME,
	GAME_OVER
}
