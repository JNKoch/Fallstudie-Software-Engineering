from deck import Deck
from player import Player
from pile import BuildingPile


class Game:

    def __init__(self):

        # Kartendeck erstellen
        self.deck = Deck()

        # Zwei Spieler
        self.players = [
            Player("Spieler 1"),
            Player("Spieler 2")
        ]

        # Vier Baukartenstapel
        self.building_piles = [
            BuildingPile(),
            BuildingPile(),
            BuildingPile(),
            BuildingPile()
        ]

        # Spieler 1 beginnt
        self.current_player = 0

        # Spiel vorbereiten
        self.setup_game()

    # ------------------------------------------------

    def setup_game(self):

        # 30 Karten auf den Vorratsstapel jedes Spielers

        for _ in range(30):

            self.players[0].stock.append(
                self.deck.draw()
            )

            self.players[1].stock.append(
                self.deck.draw()
            )

        # Jeder Spieler erhält fünf Handkarten

        for player in self.players:
            player.draw_hand(self.deck)

    # ------------------------------------------------

    def get_current_player(self):

        return self.players[self.current_player]

    # ------------------------------------------------

    def get_opponent(self):

        if self.current_player == 0:
            return self.players[1]

        return self.players[0]

    # ------------------------------------------------

    def refill_hand(self):

        player = self.get_current_player()

        player.draw_hand(self.deck)

    # ------------------------------------------------

    def next_player(self):

        self.current_player = 1 - self.current_player

        self.refill_hand()

    # ------------------------------------------------

    def is_game_over(self):

        for player in self.players:

            if len(player.stock) == 0:
                return True

        return False

    # ------------------------------------------------

    def get_winner(self):

        for player in self.players:

            if len(player.stock) == 0:
                return player

        return None

def play_hand_card(self, hand_index, pile_index):

    player = self.get_current_player()

    if hand_index < 0 or hand_index >= len(player.hand):
        return False

    if pile_index < 0 or pile_index >= len(self.building_piles):
        return False

    card = player.hand[hand_index]

    pile = self.building_piles[pile_index]

    if pile.play(card):

        player.hand.pop(hand_index)

        return True

    return False

def play_stock_card(self, pile_index):

    player = self.get_current_player()

    if len(player.stock) == 0:
        return False

    if pile_index < 0 or pile_index >= len(self.building_piles):
        return False

    card = player.stock[-1]

    pile = self.building_piles[pile_index]

    if pile.play(card):

        player.stock.pop()

        return True

    return False

def play_discard_card(self, discard_index, pile_index):

    player = self.get_current_player()

    if discard_index < 0 or discard_index >= 4:
        return False

    discard = player.discards[discard_index]

    if len(discard) == 0:
        return False

    card = discard[-1]

    pile = self.building_piles[pile_index]

    if pile.play(card):

        discard.pop()

        return True

    return False

def can_play_on_pile(self, card, pile_index):
    """Prüft, ob eine Karte auf einen Baukartenstapel gelegt werden darf."""
    if pile_index < 0 or pile_index >= len(self.building_piles):
        return False

    pile = self.building_piles[pile_index]
    return pile.playable(card)  # Diese Methode würdest du in BuildingPile ergänzen.

def game_state(self):
    player = self.get_current_player()

    return {
        "current_player": player.name,
        "hand_size": len(player.hand),
        "stock_size": len(player.stock),
        "deck_size": self.deck.remaining()
    }

