import random
from dataclasses import dataclass, field
from typing import List, Union, Optional

Card = Union[int, str]  # 1-12 oder "S" für Skip-Bo / Joker


# -----------------------------
# Konfiguration
# -----------------------------

NUMBERS_PER_CARD = 12
SKIPBO_CARDS = 18
MIN_PLAYERS = 2
MAX_PLAYERS = 4
HAND_SIZE = 5
DISCARD_PILES = 4
BUILD_PILES = 4
STOCK_SIZE_DEFAULT = 30


# -----------------------------
# Datenklassen
# -----------------------------

@dataclass
class Player:
    name: str
    stock: List[Card] = field(default_factory=list)
    hand: List[Card] = field(default_factory=list)
    discards: List[List[Card]] = field(default_factory=lambda: [[] for _ in range(DISCARD_PILES)])


@dataclass
class Game:
    players: List[Player]
    draw_pile: List[Card]
    build_piles: List[List[Card]] = field(default_factory=lambda: [[] for _ in range(BUILD_PILES)])
    current_player_index: int = 0
    running: bool = True


# -----------------------------
# Deck & Hilfsfunktionen
# -----------------------------

def create_deck() -> List[Card]:
  [Card] = []

    for number in range(1, 13):
        deck.extend([number] * NUMBERS_PER_CARD)

    deck.extend(["S"] * SKIPBO_CARDS)
    random.shuffle(deck)
    return deck


def card_to_str(card: Optional[Card]) -> str:
    if card is None:
        return "-"
    return "Skip-Bo" if card == "S" else str(card)


def pile_top(pile: List[Card]) -> Optional[Card]:
    return pile[-1] if pile
def build_pile_next_number(build_pile: List[Card]) -> int:
    """
    Leerer Baustapel erwartet 1.
    Ansonsten erwartet er die nächste Zahl nach der obersten echten/gespielten Karte.
    Joker werden intern als passende Zahl behandelt, indem sie beim Ablegen ersetzt werden.
    """
    if not build_pile:
        return 1

    top = build_pile[-1]

    if isinstance(top, int):
        return top + 1

    return 1


def can_play(card: Card, build_pile: List[Card]) -> bool:
    expected = build_pile_next_number(build_pile)

    if expected > 12:
        return False

    if card == "S":
        return True

    return card == expected


def normalize_card_for_build(card: Card, build_pile: List[Card]) -> int:
    """
    Skip-Bo-Joker wird als die Zahl gespielt, die gerade benötigt wird.
    """
    expected = build_pile_next_number(build_pile)

    if card == "S":
        return expected

    return int(card)


def draw_card(game: Game) -> Optional[Card]:
    if not game        print("Der Nachziehstapel ist leer.")
        return None

    return game.draw_pile.pop()


def draw_up_to_hand_size(game: Game, player: Player) -> None:
    while len(player.hand) < HAND_SIZE and game.draw_pile:
        card = draw_card(game)
        if card is not None:
            player.hand.append(card)


def clear_completed_build_piles(game: Game) -> None:
    for i, pile in enumerate(game.build_piles):
        if pile and pile[-1] == 12:
            print(f"Baustapel {i + 1} ist komplett und wird geleert.")
            game.build_piles[i] = []


def display_game_state(game: Game, player: Player) -> None:
    print("\n" + "=" * 60)
    print(f"Aktueller Spieler: {player.name}")
    print("=" * 60)

    print("\nBaustapel:")
    for i, pile in enumerate(game.build_piles):
        if pile:
            print(f"  B{i + 1}: oben {card_to_str(pile_top(pile))} | Stapel: {pile}")
        else:
            print(f"  B{i + 1}: leer")

    print("\nDein Vorratsstapel:")
    if player.stock:
        print(f"  Oben: {card_to_str(player.stock[-1])} | Karten übrig: {len(player.stock)}")
    else:
        print("  Leer")

    print("\nDeine Hand:")
    for i, card in enumerate(player.hand):
        print(f"  H{i + 1}: {card_to_str(card)}")

    print("\nDeine Ablagestapel:")
    for i, pile in enumerate(player.discards):
        top = pile_top(pile)
        print(f"  D{i + 1}: oben {card_to_str(top)} | Karten: {len(pile)}")

    print("\nBefehle:")
    print("  h1 b1        -> Handkarte 1 auf Baustapel 1 spielen")
    print("  s b2         -> Vorratskarte auf Baustapel 2 spielen")
    print("  d1 b3        -> oberste Karte von Ablagestapel 1 auf Baustapel 3 spielen")
    print("  discard h2 d4-> Handkarte 2 auf Ablagestapel 4 legen und Zug beenden")
    print("  help         -> Hilfe anzeigen")
    print("  quit         -> Spiel beenden")
    print("-" * 60)


def print_help() -> None:
    print("\nHilfe:")
    print("Ziel: Leere deinen Vorratsstapel zuerst.")
    print("Baustapel starten mit 1 und gehen bis 12.")
    print("Skip-Bo-Karten sind Joker und können als passende Zahl gelegt werden.")
    print("Du darfst von Hand, Vorratsstapel oder Ablagestapeln auf Baustapel spielen.")
    print("Dein Zug endet, wenn du eine Handkarte auf einen Ablagestapel legst.")


# -----------------------------
# Spielaktionen
# -----------------------------

def play_to_build_from_hand(game: Game, player: Player, hand_index: int, build_index: int) -> bool:
    if hand_index < 0 or hand_index >= len(player.hand):
        print("Ungültige Handkarte.")
        return False

    if build_index < 0 or build_index >= BUILD_PILES:
        print("Ungültiger Baustapel.")
        return False

    card = player.hand[hand_index]
    build_pile = game.build_piles[build_index]

    if not can_play(card, build_pile):
        print(f"{card_to_str(card)} kann nicht auf Baustapel {build_index + 1} gelegt werden.")
        return False

    played_card = normalize_card_for_build(card, build_pile)
    build_pile.append(played_card)
    player.hand.pop(hand_index)

    print(f"{player.name} spielt {card_to_str(card)} von der Hand auf Baustapel {build_index + 1}.")

    clear_completed_build_piles(game)

    if len(player.hand) == 0:
        print("Hand leer — du ziehst wieder auf 5 Karten.")
        draw_up_to_hand_size(game, player)

    return True


def play_to_build_from_stock(game: Game, player: Player, build_index: int) -> bool:
    if not player.stock:
        print("Dein Vorratsstapel ist bereits leer.")
        return False

    if build_index < 0 or build_index >= BUILD_PILES:
        print("Ungültiger Baustapel.")
        return False

    card = player.stock[-1]
    build_pile = game.build_piles[build_index]

    if not can_play(card, build_pile):
        print(f"{card_to_str(card)} kann nicht auf Baustapel {build_index + 1} gelegt werden.")
        return False

    played_card = normalize_card_for_build(card, build_pile)
    build_pile.append(played_card)
    player.stock.pop()

    print(f"{player.name} spielt {card_to_str(card)} vom Vorratsstapel auf Baustapel {build_index + 1}.")

    clear_completed_build_piles(game)

    if not player.stock:
        print(f"\n{player.name} hat den Vorratsstapel geleert und gewinnt!")
        game.running = False

    return True


def play_to_build_from_discard(game: Game, player: Player, discard_index: int, build_index: int) -> bool:
    if discard_index < 0 or discard_index >= DISCARD_PILES:
        print("Ungültiger Ablagestapel.")
        return False

    if build_index < 0 or build_index >= BUILD_PILES:
        print("Ungültiger Baustapel.")
        return False

    discard_pile = player.discards[discard_index]

    if not discard_pile:
        print("Dieser Ablagestapel ist leer.")
        return False

    card = discard_pile[-1]
    build_pile = game.build_piles[build_index]

    if not can_play(card, build_pile):
        print(f"{card_to_str(card)} kann nicht auf Baustapel {build_index + 1} gelegt werden.")
        return False

    played_card = normalize_card_for_build(card, build_pile)
    build_pile.append(played_card)
    discard_pile.pop()

    print(f"{player.name} spielt {card_to_str(card)} von Ablagestapel {discard_index + 1} auf Baustapel {build_index + 1}.")

    clear_completed_build_piles(game)
    return True


def discard_from_hand(player: Player, hand_index: int, discard_index: int) -> bool:
    if hand_index < 0 or hand_index >= len(player.hand):
        print("Ungültige Handkarte.")
        return False

    if discard_index < 0 or discard_index >= DISCARD_PILES:
        print("Ungültiger Ablagestapel.")
        return False

    card = player.hand.pop(hand_index)
    player.discards[discard_index].append(card)

    print(f"{player.name} legt {card_to_str(card)} auf Ablagestapel {discard_index + 1}.")
    return True


# -----------------------------
# Eingabe-Parsing
# -----------------------------

def parse_number_token(token: str, prefix: str) -> Optionaltoken = token.lower().strip()

    if not token.startswith(prefix):
        return None

    number_part = token[len(prefix):]

    if not number_part.isdigit():
        return None

    return int(number_part) - 1


def handle_command(game: Game, player: Player, command: str) -> bool:
    """
    Gibt True zurück, wenn der Zug endet.
    """
    command = command.lower().strip()

    if command == "":
        return False

    if command == "help":
        print_help()
        return False

    if command == "quit":
        game.running = False
        return True

    parts = command.split()

    # Beispiel: h1 b1
    if len(parts) == 2 and parts[0].startswith("h") and parts[1].startswith("b"):
        hand_index = parse_number_token(parts[0], "h")
        build_index = parse_number_token(parts[1], "b")

        if hand_index is None or build_index is None:
            print("Ungültiger Befehl.")
            return False

        play_to_build_from_hand(game, player, hand_index, build_index)
        return False

    # Beispiel: s b2
    if len(parts) == 2 and parts[0] == "s" and parts[1].startswith("b"):
        build_index = parse_number_token(parts[1], "b")

        if build_index is None:
            print("Ungültiger Befehl.")
            return False

        play_to_build_from_stock(game, player, build_index)
        return False

    # Beispiel: d1 b3
    if len(parts) == 2 and parts[0].startswith("d") and parts[1].startswith("b"):
        discard_index = parse_number_token(parts[0], "d")
        build_index = parse_number_token(parts[1], "b")

        if discard_index is None or build_index is None:
            print("Ungültiger Befehl.")
            return False

        play_to_build_from_discard(game, player, discard_index, build_index)
        return False

    # Beispiel: discard h2 d4
    if len(parts) == 3 and parts[0] == "discard" and parts[1].startswith("h") and parts[2].startswith("d"):
        hand_index = parse_number_token(parts[1], "h")
        discard_index = parse_number_token(parts[2], "d")

        if hand_index is None or discard_index is None:
            print("Ungültiger Befehl.")
            return False

        success = discard_from_hand(player, hand_index, discard_index)
        return success

    print("Befehl nicht erkannt. Gib 'help' ein, um die Befehle zu sehen.")
    return False


# -----------------------------
# Spielaufbau
# -----------------------------

def setup_game() -> Game:
    print("Willkommen zu Skip-Bo in Python!")

    while True:
        try:
            player_count = int(input(f"Anzahl Spieler ({MIN_PLAYERS}-{MAX_PLAYERS}): "))
            if MIN_PLAYERS <= player_count <= MAX_PLAYERS:
                break
            print("Bitte eine gültige Spieleranzahl eingeben.")
        except ValueError:
            print("Bitte eine Zahl eingeben.")

    while True:
        try:
            stock_size = int(input(f"Größe des Vorratsstapels pro Spieler, Standard {STOCK_SIZE_DEFAULT}: ") or STOCK_SIZE_DEFAULT)
            if stock_size > 0:
                break
            print("Bitte eine positive Zahl eingeben.")
        except ValueError:
            print("Bitte eine Zahl eingeben.")

    deck = create_deck()
    players: List[Player] = []

    for i in range(player_count):
        name = input(f"Name Spieler {i + 1}: ").strip()
        if not name:
            name = f"Spieler {i + 1}"

        player = Player(name=name)

        for _ in range(stock_size):
            if deck:
                player.stock.append(deck.pop())

        players.append(player)

    game = Game(players=players, draw_pile=deck)

    for player in players:
        draw_up_to_hand_size(game, player)

    return game


# -----------------------------
# Hauptschleife
# -----------------------------

def play_game() -> None:
    game = setup_game()

    while game.running:
        player = game.players[game.current_player_index]

        print(f"\n{player.name} ist am Zug.")
        draw_up_to_hand_size(game, player)

        turn_finished = False

        while game.running and not turn_finished:
            display_game_state(game, player)
            command = input("Dein Befehl: ")
            turn_finished = handle_command(game, player, command)

        if not game.running:
            break

        game.current_player_index = (game.current_player_index + 1) % len(game.players)

    print("\nSpiel beendet.")


if __name__ == "__main__":
    play_game()