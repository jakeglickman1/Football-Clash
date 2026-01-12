using System.Collections.Generic;
using UnityEngine;

public struct DiceBid
{
    public int Quantity;
    public int FaceValue;

    public override string ToString()
    {
        return $"{Quantity} × {FaceValue}";
    }
}

/// <summary>
/// Handles dice rolls, storage, and validation for Liar's Dice mode.
/// </summary>
public class DiceManager : MonoBehaviour
{
    [SerializeField] private int dicePerPlayer = 5;

    private readonly Dictionary<PlayerController, int[]> playerDice = new();

    /// <summary>
    /// Clears old dice and rolls fresh values for every alive player.
    /// </summary>
    public void PrepareNewRound(IEnumerable<PlayerController> players)
    {
        playerDice.Clear();

        foreach (var player in players)
        {
            if (!player.IsAlive) continue;

            int[] diceValues = new int[dicePerPlayer];
            for (int i = 0; i < diceValues.Length; i++)
            {
                diceValues[i] = Random.Range(1, 7);
            }

            playerDice[player] = diceValues;
        }
    }

    /// <summary>
    /// Returns the hidden dice for UI display or AI logic.
    /// </summary>
    public int[] PeekDice(PlayerController player)
    {
        if (playerDice.TryGetValue(player, out var values))
        {
            return values;
        }

        return System.Array.Empty<int>();
    }

    /// <summary>
    /// Generates an AI raise by nudging the previous bid.
    /// </summary>
    public DiceBid GenerateRaise(PlayerController player, DiceBid previousBid)
    {
        DiceBid bid = previousBid;
        bool increaseQuantity = Random.value > 0.5f;

        if (previousBid.Quantity <= 0)
        {
            // Seed the first bid from the player's own dice.
            var dice = PeekDice(player);
            int face = dice.Length > 0 ? dice[Random.Range(0, dice.Length)] : Random.Range(1, 7);
            int quantity = Mathf.Max(1, CountFace(dice, face));
            bid = new DiceBid { Quantity = quantity, FaceValue = face };
            return EnsureLegalRaise(bid, previousBid);
        }

        if (increaseQuantity)
        {
            bid.Quantity += 1;
        }
        else
        {
            bid.FaceValue += 1;
        }

        return EnsureLegalRaise(bid, previousBid);
    }

    /// <summary>
    /// Ensures the bid is within limits and actually raises the previous offer.
    /// </summary>
    public DiceBid EnsureLegalRaise(DiceBid candidate, DiceBid previousBid)
    {
        int maxDice = dicePerPlayer * Mathf.Max(1, playerDice.Count);
        candidate.Quantity = Mathf.Clamp(candidate.Quantity, 1, maxDice);
        candidate.FaceValue = Mathf.Clamp(candidate.FaceValue, 1, 6);

        if (previousBid.Quantity <= 0 && previousBid.FaceValue <= 0)
        {
            return candidate;
        }

        if (candidate.Quantity < previousBid.Quantity)
        {
            candidate.Quantity = previousBid.Quantity;
        }

        if (candidate.Quantity == previousBid.Quantity && candidate.FaceValue <= previousBid.FaceValue)
        {
            if (candidate.FaceValue < 6)
            {
                candidate.FaceValue = Mathf.Min(6, previousBid.FaceValue + 1);
            }
            else
            {
                candidate.FaceValue = previousBid.FaceValue;
                candidate.Quantity = Mathf.Min(maxDice, previousBid.Quantity + 1);
            }
        }

        if (candidate.Quantity == previousBid.Quantity && candidate.FaceValue <= previousBid.FaceValue)
        {
            candidate.Quantity = Mathf.Min(maxDice, previousBid.Quantity + 1);
            candidate.FaceValue = previousBid.FaceValue;
        }

        return candidate;
    }

    /// <summary>
    /// Verifies a bid against all dice at the table.
    /// </summary>
    public bool ValidateBid(DiceBid bid)
    {
        int matchingDice = 0;
        foreach (var entry in playerDice)
        {
            foreach (var value in entry.Value)
            {
                if (value == bid.FaceValue)
                {
                    matchingDice++;
                }
            }
        }

        return matchingDice >= bid.Quantity;
    }

    /// <summary>
    /// Returns a copy of everyone's dice for reveal moments.
    /// </summary>
    public Dictionary<PlayerController, int[]> RevealDice()
    {
        return new Dictionary<PlayerController, int[]>(playerDice);
    }

    private int CountFace(int[] diceValues, int face)
    {
        int count = 0;
        foreach (var value in diceValues)
        {
            if (value == face)
            {
                count++;
            }
        }
        return count;
    }
}
