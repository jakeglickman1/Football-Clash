using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Maintains the current bluff claim, truth state, and helper utilities for both game modes.
/// </summary>
public class BluffSystem : MonoBehaviour
{
    [SerializeField, Range(0f, 1f)] private float lieBias = 0.4f;
    [SerializeField] private CardManager cardManager;
    [SerializeField] private DiceManager diceManager;

    public PlayerController LastClaimOwner { get; private set; }
    public PlayerController LastLiar { get; private set; }

    public CardManager.CardData CurrentCardClaim { get; private set; }
    public DiceBid CurrentDiceBid { get; private set; }

    public GameMode CurrentMode { get; private set; } = GameMode.CardBluff;

    private bool lastClaimTruth = true;

    /// <summary>
    /// Starts a fresh card round: reset state, build a new deck, and deal.
    /// </summary>
    public void BeginCardRound(IEnumerable<PlayerController> players)
    {
        CurrentMode = GameMode.CardBluff;
        ResetState();
        cardManager.ResetDeck();
        cardManager.DealHands(players);

        foreach (var player in players)
        {
            player.ResetForRound();
        }
    }

    /// <summary>
    /// Starts a fresh dice round: roll new dice and reset claim state.
    /// </summary>
    public void BeginDiceRound(IEnumerable<PlayerController> players)
    {
        CurrentMode = GameMode.DiceBluff;
        ResetState();
        diceManager.PrepareNewRound(players);

        foreach (var player in players)
        {
            player.ResetForRound();
        }
    }

    /// <summary>
    /// Generates a card claim for AI/testing. Returns whether the player tells the truth.
    /// </summary>
    public CardManager.CardData GenerateCardClaim(PlayerController player, out bool tellsTruth)
    {
        CardManager.CardData actualCard = cardManager.PeekHand(player);
        tellsTruth = Random.value > lieBias;

        return tellsTruth ? actualCard : cardManager.GenerateMisdirectionCard(actualCard);
    }

    /// <summary>
    /// Generates a dice bid, either truthful or a lie, ensuring it raises the previous bid.
    /// </summary>
    public DiceBid GenerateDiceClaim(PlayerController player, DiceBid previousBid, out bool tellsTruth)
    {
        tellsTruth = Random.value > lieBias;

        if (tellsTruth)
        {
            var dice = diceManager.PeekDice(player);
            if (dice.Length == 0)
            {
                return diceManager.GenerateRaise(player, previousBid);
            }

            int face = dice[Random.Range(0, dice.Length)];
            int quantity = 0;
            foreach (var value in dice)
            {
                if (value == face)
                {
                    quantity++;
                }
            }

            var truthfulBid = new DiceBid { Quantity = Mathf.Max(1, quantity), FaceValue = face };
            return diceManager.EnsureLegalRaise(truthfulBid, previousBid);
        }

        return diceManager.GenerateRaise(player, previousBid);
    }

    public void SubmitCardClaim(PlayerController player, CardManager.CardData declaredCard)
    {
        LastClaimOwner = player;
        CurrentMode = GameMode.CardBluff;
        CurrentCardClaim = declaredCard;

        lastClaimTruth = cardManager.VerifyCardClaim(player, declaredCard);
        LastLiar = lastClaimTruth ? null : player;

        player.ReactToBluff(!lastClaimTruth);
        Debug.Log($"{player.DisplayName} claims: {declaredCard} (truth: {lastClaimTruth})");
    }

    public void SubmitDiceBid(PlayerController player, DiceBid bid)
    {
        CurrentMode = GameMode.DiceBluff;
        LastClaimOwner = player;
        CurrentDiceBid = diceManager.EnsureLegalRaise(bid, CurrentDiceBid);

        lastClaimTruth = diceManager.ValidateBid(CurrentDiceBid);
        LastLiar = lastClaimTruth ? null : player;

        player.ReactToBluff(!lastClaimTruth);
        Debug.Log($"{player.DisplayName} bids {CurrentDiceBid} (truth: {lastClaimTruth})");
    }

    /// <summary>
    /// Resolves a call. Returns true if the last claim was truthful, false if it was a lie.
    /// </summary>
    public bool ResolveCall(PlayerController challenger)
    {
        challenger.ReactToBluff(false);

        if (LastClaimOwner == null)
        {
            Debug.LogWarning("No claim to challenge.");
            return true;
        }

        if (CurrentMode == GameMode.DiceBluff)
        {
            lastClaimTruth = diceManager.ValidateBid(CurrentDiceBid);
            LastLiar = lastClaimTruth ? null : LastClaimOwner;
        }

        if (CurrentMode == GameMode.CardBluff)
        {
            var actualCard = cardManager.RevealPlayerCard(LastClaimOwner);
            lastClaimTruth = cardManager.VerifyCardClaim(LastClaimOwner, CurrentCardClaim);
            LastLiar = lastClaimTruth ? null : LastClaimOwner;
            Debug.Log($"Reveal: {LastClaimOwner.DisplayName} held {actualCard}");
        }

        return lastClaimTruth;
    }

    private void ResetState()
    {
        LastClaimOwner = null;
        LastLiar = null;
        CurrentCardClaim = default;
        CurrentDiceBid = new DiceBid { Quantity = 0, FaceValue = 0 };
        lastClaimTruth = true;
    }
}
