class BuildingPile:

    def __init__(self):
        self.cards = []

    def top(self):
        if not self.cards:
            return None

        return self.cards[-1]

    def next_value(self):

        if len(self.cards) == 0:
            return 1

        return self.cards[-1].value + 1

    def play(self, card):

        if card.is_skipbo:

            card.value = self.next_value()

        if card.value == self.next_value():

            self.cards.append(card)

            if card.value == 12:
                self.cards.clear()

            return True

        return False