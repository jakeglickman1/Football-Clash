extends RefCounted
class_name DiceBid

var quantity: int = 0
var face_value: int = 0

func _init(quantity: int = 0, face_value: int = 0):
	self.quantity = quantity
	self.face_value = face_value

func duplicate() -> DiceBid:
	return DiceBid.new(quantity, face_value)

func clamp(max_dice: int):
	quantity = int(clamp(quantity, 1, max_dice))
	face_value = int(clamp(face_value, 1, 6))

func is_empty() -> bool:
	return quantity <= 0 and face_value <= 0

func _to_string() -> String:
	return "%d × %d" % [quantity, face_value]
