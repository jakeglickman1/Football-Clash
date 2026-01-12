using System;
using UnityEngine;

/// <summary>
/// Represents a connected player avatar. Networking components can wrap this behaviour
/// to synchronise state across clients while gameplay systems stay decoupled.
/// </summary>
[RequireComponent(typeof(Collider))]
public class PlayerController : MonoBehaviour
{
    [SerializeField] private string displayName = "Player";
    [SerializeField] private Animator animator;

    [Header("Runtime State")]
    [SerializeField] private bool isAlive = true;
    [SerializeField] private int poisonDrinks;
    [SerializeField] private int roundsSurvived;

    /// <summary>
    /// Optional hook for binding a character profile (Scubby, Foxy, etc.).
    /// </summary>
    [SerializeField] private string characterId = "default";

    public string DisplayName => displayName;
    public bool IsAlive => isAlive;
    public int PoisonDrinks => poisonDrinks;
    public int RoundsSurvived => roundsSurvived;
    public string CharacterId => characterId;

    /// <summary>
    /// Stub for wiring in Netcode for GameObjects or Photon identifiers.
    /// </summary>
    public Guid NetworkId { get; private set; } = Guid.NewGuid();

    public event Action<PlayerController> PlayerDied;

    private static readonly int IdleHash = Animator.StringToHash("Idle");
    private static readonly int ResetHash = Animator.StringToHash("Reset");
    private static readonly int DrinkHash = Animator.StringToHash("Drink");
    private static readonly int DieHash = Animator.StringToHash("Die");
    private static readonly int BluffHash = Animator.StringToHash("Bluff");
    private static readonly int CallHash = Animator.StringToHash("Call");

    public void Initialize(string nameOverride, string assignedCharacter)
    {
        displayName = nameOverride;
        characterId = assignedCharacter;
    }

    public void PlayIdle()
    {
        if (animator != null)
        {
            animator.CrossFade(IdleHash, 0.15f, 0, UnityEngine.Random.value);
        }
    }

    public void ReactToBluff(bool isLiar)
    {
        if (animator == null) return;
        animator.SetTrigger(isLiar ? BluffHash : CallHash);
    }

    public void DrinkPoison()
    {
        if (!isAlive) return;

        poisonDrinks++;
        animator?.SetTrigger(DrinkHash);
    }

    public void IncrementRoundSurvival()
    {
        roundsSurvived++;
    }

    public void KillPlayer(string reason)
    {
        if (!isAlive) return;

        isAlive = false;
        animator?.SetTrigger(DieHash);
        Debug.Log($"{displayName} eliminated via {reason}");
        PlayerDied?.Invoke(this);
    }

    public void Revive()
    {
        isAlive = true;
        poisonDrinks = 0;
        roundsSurvived = 0;
        animator?.ResetTrigger(DieHash);
        animator?.SetTrigger(ResetHash);
    }

    public void ResetForRound()
    {
        if (!isAlive) return;
        animator?.ResetTrigger(BluffHash);
        animator?.ResetTrigger(CallHash);
        animator?.SetTrigger(ResetHash);
    }
}
