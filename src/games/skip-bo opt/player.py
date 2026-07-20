class Player:

    def __init__(self, name):

        self.name = name

        self.stock = []

        self.hand = []

        self.discards = [
            [],
            [],
            [],
            []
        ]

    def draw_hand(self, deck):

        while len(self.hand) < 5:

            card = deck.draw()

            if card:

                self.hand.append(card)

    def top_stock(self):

        if len(self.stock) == 0:

            return None

        return self.stock[-1]