extends RefCounted
class_name CardData

var rank: String = ""
var suit: String = ""

func _init(rank: String = "", suit: String = ""):
	self.rank = rank
	self.suit = suit

func equals(other: CardData) -> bool:
	if other == null:
		return false
	return rank == other.rank and suit == other.suit

func duplicate() -> CardData:
	return CardData.new(rank, suit)

func _to_string() -> String:
	return "%s of %s" % [rank, suit]
