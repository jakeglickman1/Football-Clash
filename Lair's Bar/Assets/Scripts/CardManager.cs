using System;
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Handles deck lifecycle and per-player hands for the card bluff mode.
/// Cards are intentionally lightweight so UI layers can skin them later.
/// </summary>
public class CardManager : MonoBehaviour
{
    [Serializable]
    public struct CardData : IEquatable<CardData>
    {
        public string Rank;
        public string Suit;

        public bool Equals(CardData other)
        {
            return Rank == other.Rank && Suit == other.Suit;
        }

        public override bool Equals(object obj)
        {
            return obj is CardData other && Equals(other);
        }

        public override int GetHashCode()
        {
            unchecked
            {
                return ((Rank != null ? Rank.GetHashCode() : 0) * 397) ^ (Suit != null ? Suit.GetHashCode() : 0);
            }
        }

        public override string ToString()
        {
            return $"{Rank} of {Suit}";
        }
    }

    [SerializeField] private string[] ranks = { "Ace", "King", "Queen", "Jack", "Ten", "Nine" };
    [SerializeField] private string[] suits = { "Hearts", "Spades", "Clubs", "Diamonds" };

    private readonly List<CardData> deck = new();
    private readonly Dictionary<PlayerController, CardData> playerHands = new();

    private void Awake()
    {
        if (deck.Count == 0)
        {
            ResetDeck();
        }
    }

    /// <summary>
    /// Clears the deck and rebuilds a fresh ordered stack before shuffling.
    /// </summary>
    public void ResetDeck()
    {
        deck.Clear();

        foreach (var rank in ranks)
        {
            foreach (var suit in suits)
            {
                deck.Add(new CardData { Rank = rank, Suit = suit });
            }
        }

        ShuffleDeck();
        playerHands.Clear();
    }

    /// <summary>
    /// Assigns a single hidden card to each active player.
    /// </summary>
    public void DealHands(IEnumerable<PlayerController> players)
    {
        foreach (var player in players)
        {
            if (!player.IsAlive) continue;
            DealCardToPlayer(player);
        }
    }

    /// <summary>
    /// Draws from the top of the deck and hands it to the player.
    /// </summary>
    public CardData DealCardToPlayer(PlayerController player)
    {
        if (deck.Count == 0)
        {
            ResetDeck();
        }

        CardData card = deck[0];
        deck.RemoveAt(0);
        playerHands[player] = card;
        return card;
    }

    /// <summary>
    /// Returns the player's actual card without removing it.
    /// </summary>
    public CardData PeekHand(PlayerController player)
    {
        if (playerHands.TryGetValue(player, out var card))
        {
            return card;
        }

        return DealCardToPlayer(player);
    }

    /// <summary>
    /// Verifies the declared card against the concealed value.
    /// </summary>
    public bool VerifyCardClaim(PlayerController player, CardData claimed)
    {
        if (!playerHands.TryGetValue(player, out var actual))
        {
            return false;
        }

        return actual.Equals(claimed);
    }

    /// <summary>
    /// Reveals and keeps the player's card for debugging/logging.
    /// </summary>
    public CardData RevealPlayerCard(PlayerController player)
    {
        if (!playerHands.TryGetValue(player, out var card))
        {
            return default;
        }

        return card;
    }

    /// <summary>
    /// Removes the player's card so they can be dealt a fresh one later.
    /// </summary>
    public void DiscardPlayerCard(PlayerController player)
    {
        if (playerHands.ContainsKey(player))
        {
            playerHands.Remove(player);
        }
    }

    /// <summary>
    /// Provides a random fake card that differs from the supplied actual card.
    /// </summary>
    public CardData GenerateMisdirectionCard(CardData realCard)
    {
        CardData fake = realCard;
        int guard = 0;

        while (fake.Equals(realCard) && guard < 16)
        {
            guard++;
            fake = new CardData
            {
                Rank = GetRandomRank(),
                Suit = GetRandomSuit()
            };
        }

        return fake;
    }

    private string GetRandomRank()
    {
        if (ranks == null || ranks.Length == 0)
        {
            return "Ace";
        }

        return ranks[UnityEngine.Random.Range(0, ranks.Length)];
    }

    private string GetRandomSuit()
    {
        if (suits == null || suits.Length == 0)
        {
            return "Spades";
        }

        return suits[UnityEngine.Random.Range(0, suits.Length)];
    }

    private void ShuffleDeck()
    {
        for (int i = 0; i < deck.Count; i++)
        {
            int randomIndex = UnityEngine.Random.Range(i, deck.Count);
            (deck[i], deck[randomIndex]) = (deck[randomIndex], deck[i]);
        }
    }
}
