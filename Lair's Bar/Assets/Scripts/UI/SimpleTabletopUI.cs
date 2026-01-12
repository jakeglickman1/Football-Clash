using System.Text;
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.UI;

/// <summary>
/// Minimal HUD controller that wires scene buttons to the GameManager and
/// mirrors player readiness for quick iteration in editor play mode.
/// </summary>
public class SimpleTabletopUI : MonoBehaviour
{
    [SerializeField] private GameManager gameManager;
    [SerializeField] private Button startCardsButton;
    [SerializeField] private Button startDiceButton;
    [SerializeField] private Text lobbyListLabel;

    private void Awake()
    {
        if (gameManager == null)
        {
            gameManager = GameManager.Instance;
        }

        WireButtons();
    }

    private void OnEnable()
    {
        RefreshLobbyList();
        if (lobbyListLabel != null)
        {
            InvokeRepeating(nameof(RefreshLobbyList), 0f, 1f);
        }
    }

    private void OnDisable()
    {
        CancelInvoke(nameof(RefreshLobbyList));
    }

    public void InjectDependencies(GameManager manager, Button cardsButton, Button diceButton, Text lobbyText)
    {
        gameManager = manager;
        RewriteButton(ref startCardsButton, cardsButton, () => StartGame(GameMode.CardBluff));
        RewriteButton(ref startDiceButton, diceButton, () => StartGame(GameMode.DiceBluff));
        lobbyListLabel = lobbyText;

        WireButtons();
        RefreshLobbyList();
    }

    private void StartGame(GameMode mode)
    {
        gameManager?.BeginMatch(mode);
    }

    private void RefreshLobbyList()
    {
        if (gameManager == null || lobbyListLabel == null)
        {
            return;
        }

        var players = gameManager.Players;
        if (players == null || players.Count == 0)
        {
            lobbyListLabel.text = "Lobby empty.";
            return;
        }

        var builder = new StringBuilder();
        foreach (var player in players)
        {
            builder.Append(player.DisplayName);
            builder.Append(player.IsAlive ? " - Ready" : " - Eliminated");
            builder.AppendLine();
        }

        lobbyListLabel.text = builder.ToString();
    }

    private void WireButtons()
    {
        if (startCardsButton != null)
        {
            startCardsButton.onClick.RemoveAllListeners();
            startCardsButton.onClick.AddListener(() => StartGame(GameMode.CardBluff));
        }

        if (startDiceButton != null)
        {
            startDiceButton.onClick.RemoveAllListeners();
            startDiceButton.onClick.AddListener(() => StartGame(GameMode.DiceBluff));
        }
    }

    private void RewriteButton(ref Button field, Button incoming, UnityAction action)
    {
        if (field != null)
        {
            field.onClick.RemoveAllListeners();
        }

        field = incoming;

        if (field != null)
        {
            field.onClick.RemoveAllListeners();
            if (action != null)
            {
                field.onClick.AddListener(action);
            }
        }
    }
}
