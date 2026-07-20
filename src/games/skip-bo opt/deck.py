import random
from card import Card

class Deck:

    def __init__(self):
        self.cards = []

        for number in range(1, 13):
            for _ in range(12):
                self.cards.append(Card(number))

        for _ in range(18):
            self.cards.append(Card("SB"))

        random.shuffle(self.cards)

    def draw(self):
        if len(self.cards) == 0:
            return None

        return self.cards.pop()

    def remaining(self):
        return len(self.cards)