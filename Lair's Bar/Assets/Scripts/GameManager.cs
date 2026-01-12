using System.Collections.Generic;
using System.Text;
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.UI;

public enum GameMode
{
    CardBluff,
    DiceBluff
}

public enum GamePhase
{
    Lobby,
    RoundIntro,
    PlayerTurn,
    Resolution,
    Minigame,
    GameOver
}

/// <summary>
/// Central coordinator for the core loop, UI hooks, and high-level state machine.
/// Keeps the logic intentionally approachable so networking and content teams can extend later.
/// </summary>
public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    [Header("Core Systems")]
    [SerializeField] private CardManager cardManager;
    [SerializeField] private DiceManager diceManager;
    [SerializeField] private BluffSystem bluffSystem;
    [SerializeField] private RussianRoulette russianRoulette;

    [Header("UI References")]
    [SerializeField] private Button bluffButton;
    [SerializeField] private Button callButton;
    [SerializeField] private Button raiseButton;
    [SerializeField] private Button drinkButton;
    [SerializeField] private Text statusLabel;
    [SerializeField] private Text modeLabel;
    [SerializeField] private Text scoreboardLabel;

    [Header("Scene Objects")]
    [SerializeField] private Transform playerSpawnRoot;
    [SerializeField] private GameObject playerPrefab;

    [Header("Debug")]
    [SerializeField] private bool revealTruthDebug = true;

    private readonly List<PlayerController> players = new();
    private int activePlayerIndex = -1;

    public GameMode ActiveMode { get; private set; } = GameMode.CardBluff;
    public GamePhase Phase { get; private set; } = GamePhase.Lobby;

    public IReadOnlyList<PlayerController> Players => players;

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }

        Instance = this;
    }

    private void Start()
    {
        WireButtonCallbacks();
        UpdateModeLabel();
        UpdateStatus("Waiting for players...");
        ConfigureUi(false);
        RefreshScoreboard();
    }

    /// <summary>
    /// Allows runtime or editor scripts to inject UI references instead of manual inspector wiring.
    /// </summary>
    public void InjectUiReferences(Button bluff, Button call, Button raise, Button drink, Text status, Text mode, Text scoreboard)
    {
        AssignButtonField(ref bluffButton, bluff, OnBluffButton);
        AssignButtonField(ref callButton, call, OnCallButton);
        AssignButtonField(ref raiseButton, raise, OnRaiseButton);
        AssignButtonField(ref drinkButton, drink, OnDrinkButton);

        statusLabel = status;
        modeLabel = mode;
        scoreboardLabel = scoreboard;

        WireButtonCallbacks();
        ConfigureUiForMode();
        RefreshScoreboard();
    }

    public void SetTruthDebug(bool enabled)
    {
        revealTruthDebug = enabled;
    }

    /// <summary>
    /// Sample lobby hook: call once all players have joined.
    /// </summary>
    public void BeginMatch(GameMode selectedMode)
    {
        if (players.Count == 0)
        {
            UpdateStatus("No players registered.");
            return;
        }

        ActiveMode = selectedMode;
        Phase = GamePhase.RoundIntro;
        ConfigureUiForMode();
        ConfigureUi(false);
        UpdateModeLabel();

        switch (ActiveMode)
        {
            case GameMode.CardBluff:
                bluffSystem.BeginCardRound(players);
                break;
            case GameMode.DiceBluff:
                bluffSystem.BeginDiceRound(players);
                break;
        }

        Phase = GamePhase.PlayerTurn;
        activePlayerIndex = FindNextAliveIndex(-1);
        ConfigureUi(true);
        UpdateTurnStatus();
        RefreshScoreboard();
    }

    /// <summary>
    /// Registers a player avatar. Networking layer should call this when spawning players.
    /// </summary>
    public void RegisterPlayer(PlayerController controller)
    {
        if (controller == null || players.Contains(controller))
        {
            return;
        }

        players.Add(controller);
        controller.PlayerDied += HandlePlayerDeath;
        controller.PlayIdle();
        RefreshScoreboard();
    }

    /// <summary>
    /// Optional helper for despawning players mid-session.
    /// </summary>
    public void UnregisterPlayer(PlayerController controller)
    {
        if (controller == null) return;

        if (players.Remove(controller))
        {
            controller.PlayerDied -= HandlePlayerDeath;
            if (players.Count == 0)
            {
                Phase = GamePhase.Lobby;
                UpdateStatus("Waiting for players...");
            }
            RefreshScoreboard();
        }
    }

    /// <summary>
    /// UI callback for bluffing/declaring a claim.
    /// </summary>
    public void OnBluffButton()
    {
        var player = GetCurrentPlayer();
        if (player == null) return;

        switch (ActiveMode)
        {
            case GameMode.CardBluff:
            {
                var claim = bluffSystem.GenerateCardClaim(player, out var tellsTruth);
                bluffSystem.SubmitCardClaim(player, claim);
                UpdateStatus(revealTruthDebug
                    ? $"{player.DisplayName} declares a {claim.Rank}. Truth: {tellsTruth}"
                    : $"{player.DisplayName} makes a claim.");
                break;
            }
            case GameMode.DiceBluff:
            {
                var claim = bluffSystem.GenerateDiceClaim(player, bluffSystem.CurrentDiceBid, out var tellsTruth);
                bluffSystem.SubmitDiceBid(player, claim);
                UpdateStatus(revealTruthDebug
                    ? $"{player.DisplayName} bids {claim}. Truth: {tellsTruth}"
                    : $"{player.DisplayName} raises the stakes.");
                break;
            }
        }

        AdvanceTurn();
    }

    /// <summary>
    /// UI callback when the active player challenges the previous claim.
    /// </summary>
    public void OnCallButton()
    {
        var challenger = GetCurrentPlayer();
        if (challenger == null || bluffSystem.LastClaimOwner == null) return;

        bool claimWasTrue = bluffSystem.ResolveCall(challenger);

        if (!claimWasTrue && ActiveMode == GameMode.CardBluff)
        {
            Phase = GamePhase.Minigame;
            UpdateStatus($"{challenger.DisplayName} caught {bluffSystem.LastClaimOwner.DisplayName}! Russian Roulette...");
            ConfigureUi(false);
            russianRoulette.PlaySequence(bluffSystem.LastLiar, OnRussianRouletteFinished);
            return;
        }

        var affectedPlayer = claimWasTrue ? challenger : bluffSystem.LastClaimOwner;
        UpdateStatus(claimWasTrue
            ? $"{challenger.DisplayName} challenged incorrectly!"
            : $"{challenger.DisplayName} exposes {bluffSystem.LastClaimOwner.DisplayName}!");

        HandleResolution(affectedPlayer);
    }

    /// <summary>
    /// UI callback for raising during dice rounds.
    /// </summary>
    public void OnRaiseButton()
    {
        if (ActiveMode != GameMode.DiceBluff) return;

        var player = GetCurrentPlayer();
        if (player == null) return;

        var bid = bluffSystem.GenerateDiceClaim(player, bluffSystem.CurrentDiceBid, out var tellsTruth);
        bluffSystem.SubmitDiceBid(player, bid);
        UpdateStatus(revealTruthDebug
            ? $"{player.DisplayName} raises to {bid}. Truth: {tellsTruth}"
            : $"{player.DisplayName} sweetens the bluff.");
        AdvanceTurn();
    }

    /// <summary>
    /// UI callback for manually forcing a poison drink (debug/testing aid).
    /// </summary>
    public void OnDrinkButton()
    {
        var player = GetCurrentPlayer();
        if (player == null) return;

        player.DrinkPoison();
        CheckForEliminations();
        RefreshScoreboard();
        AdvanceTurn();
    }

    private void OnRussianRouletteFinished(PlayerController unluckyPlayer, bool survived)
    {
        Phase = GamePhase.Resolution;

        if (!survived && unluckyPlayer != null)
        {
            unluckyPlayer.KillPlayer("Russian Roulette");
        }

        UpdateStatus(survived ? "Click... they live." : $"Bang! {unluckyPlayer?.DisplayName} is out.");
        HandleResolution(unluckyPlayer);
    }

    private void HandleResolution(PlayerController affectedPlayer)
    {
        Phase = GamePhase.Resolution;

        if (ActiveMode == GameMode.DiceBluff && affectedPlayer != null && affectedPlayer.IsAlive)
        {
            affectedPlayer.DrinkPoison();
        }

        CheckForEliminations();
        RefreshScoreboard();

        if (TryDeclareWinner(out var winner))
        {
            Phase = GamePhase.GameOver;
            ConfigureUi(false);
            UpdateStatus(winner != null ? $"{winner.DisplayName} wins!" : "All patrons perished.");
            return;
        }

        foreach (var player in players)
        {
            if (player.IsAlive)
            {
                player.IncrementRoundSurvival();
            }
        }

        BeginMatch(ActiveMode);
    }

    private void CheckForEliminations()
    {
        foreach (var player in players)
        {
            if (!player.IsAlive) continue;
            if (player.PoisonDrinks >= 2)
            {
                player.KillPlayer("Poison");
            }
        }
    }

    private bool TryDeclareWinner(out PlayerController winner)
    {
        winner = null;
        int aliveCount = 0;

        foreach (var player in players)
        {
            if (!player.IsAlive) continue;
            aliveCount++;
            winner = player;
        }

        if (aliveCount <= 1)
        {
            return true;
        }

        winner = null;
        return false;
    }

    private void AdvanceTurn()
    {
        Phase = GamePhase.PlayerTurn;
        activePlayerIndex = FindNextAliveIndex(activePlayerIndex);

        if (activePlayerIndex == -1)
        {
            if (TryDeclareWinner(out var winner))
            {
                Phase = GamePhase.GameOver;
                ConfigureUi(false);
                UpdateStatus(winner != null ? $"{winner.DisplayName} wins!" : "No survivors remain.");
            }
            return;
        }

        UpdateTurnStatus();
    }

    private int FindNextAliveIndex(int startIndex)
    {
        if (players.Count == 0) return -1;

        for (int i = 1; i <= players.Count; i++)
        {
            int candidate = (startIndex + i + players.Count) % players.Count;
            if (players[candidate].IsAlive)
            {
                return candidate;
            }
        }

        return -1;
    }

    private PlayerController GetCurrentPlayer()
    {
        if (players.Count == 0) return null;
        if (activePlayerIndex < 0 || activePlayerIndex >= players.Count)
        {
            activePlayerIndex = FindNextAliveIndex(activePlayerIndex);
        }

        if (activePlayerIndex == -1) return null;
        var candidate = players[activePlayerIndex];
        return candidate.IsAlive ? candidate : null;
    }

    private void UpdateTurnStatus()
    {
        var player = GetCurrentPlayer();
        if (player == null)
        {
            UpdateStatus("All players eliminated or missing.");
            return;
        }

        UpdateStatus($"{player.DisplayName}'s turn");
    }

    private void ConfigureUi(bool interactable)
    {
        SetButtonState(bluffButton, interactable);
        SetButtonState(callButton, interactable);
        SetButtonState(raiseButton, interactable);
        SetButtonState(drinkButton, interactable);

        ConfigureUiForMode();
    }

    private void ConfigureUiForMode()
    {
        bool playingDice = ActiveMode == GameMode.DiceBluff;

        if (raiseButton != null)
        {
            raiseButton.gameObject.SetActive(playingDice);
        }

        if (drinkButton != null)
        {
            drinkButton.gameObject.SetActive(playingDice);
        }
    }

    private void SetButtonState(Button button, bool interactable)
    {
        if (button == null) return;
        button.interactable = interactable;
        button.gameObject.SetActive(true);
    }

    private void UpdateStatus(string message)
    {
        if (statusLabel != null)
        {
            statusLabel.text = message;
        }
    }

    private void UpdateModeLabel()
    {
        if (modeLabel != null)
        {
            modeLabel.text = $"Mode: {ActiveMode}";
        }
    }

    private void RefreshScoreboard()
    {
        if (scoreboardLabel == null)
        {
            return;
        }

        var builder = new StringBuilder();
        foreach (var player in players)
        {
            builder.Append(player.DisplayName);
            builder.Append(player.IsAlive ? " (alive)" : " (dead)");
            builder.Append($" | Poison: {player.PoisonDrinks}");
            builder.AppendLine();
        }

        scoreboardLabel.text = builder.Length > 0 ? builder.ToString() : "No patrons seated.";
    }

    private void HandlePlayerDeath(PlayerController player)
    {
        if (players.IndexOf(player) == activePlayerIndex)
        {
            activePlayerIndex = FindNextAliveIndex(activePlayerIndex);
        }

        RefreshScoreboard();
    }

    private void WireButtonCallbacks()
    {
        AssignListener(bluffButton, OnBluffButton);
        AssignListener(callButton, OnCallButton);
        AssignListener(raiseButton, OnRaiseButton);
        AssignListener(drinkButton, OnDrinkButton);
    }

    private void AssignListener(Button button, UnityAction action)
    {
        if (button == null || action == null) return;
        button.onClick.RemoveListener(action);
        button.onClick.AddListener(action);
    }

    private void AssignButtonField(ref Button field, Button incoming, UnityAction action)
    {
        if (field != null && action != null)
        {
            field.onClick.RemoveListener(action);
        }

        field = incoming;

        if (field != null && action != null)
        {
            field.onClick.RemoveListener(action);
            field.onClick.AddListener(action);
        }
    }

#if UNITY_EDITOR
    private void OnValidate()
    {
        if (cardManager == null) cardManager = FindObjectOfType<CardManager>();
        if (diceManager == null) diceManager = FindObjectOfType<DiceManager>();
        if (bluffSystem == null) bluffSystem = FindObjectOfType<BluffSystem>();
        if (russianRoulette == null) russianRoulette = FindObjectOfType<RussianRoulette>();
    }
#endif
}
