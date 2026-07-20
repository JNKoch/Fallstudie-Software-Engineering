class Card:
    def __init__(self, value):
        self.value = value

    @property
    def is_skipbo(self):
        return self.value == "SB"

    def __str__(self):
        return str(self.value)