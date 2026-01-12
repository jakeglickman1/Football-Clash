using System.Reflection;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

/// <summary>
/// Builds a minimal runtime UI so designers can hit Play without manual wiring.
/// Generates a canvas, status labels, and control buttons, then injects references
/// into the GameManager and SimpleTabletopUI.
/// </summary>
[DefaultExecutionOrder(-200)]
public class RuntimeUiBuilder : MonoBehaviour
{
    [SerializeField] private GameManager gameManager;
    [SerializeField] private SimpleTabletopUI tabletopUi;

    private void Awake()
    {
        if (gameManager == null)
        {
            gameManager = FindObjectOfType<GameManager>();
        }

        if (tabletopUi == null)
        {
            tabletopUi = FindObjectOfType<SimpleTabletopUI>();
        }

        BuildUiIfMissing();
    }

    private void BuildUiIfMissing()
    {
        if (gameManager == null)
        {
            Debug.LogWarning("RuntimeUiBuilder: No GameManager found; aborting UI build.");
            return;
        }

        if (HasExistingAssignments())
        {
            return;
        }

        Canvas canvas = EnsureCanvas();
        var font = Resources.GetBuiltinResource<Font>("Arial.ttf");

        GameObject rootPanel = CreateUiObject("ControlsPanel", canvas.transform);
        var panelRect = rootPanel.GetComponent<RectTransform>();
        panelRect.anchorMin = new Vector2(0f, 0f);
        panelRect.anchorMax = new Vector2(0f, 0f);
        panelRect.pivot = new Vector2(0f, 0f);
        panelRect.anchoredPosition = new Vector2(20f, 20f);
        panelRect.sizeDelta = new Vector2(280f, 320f);

        var panelImage = rootPanel.AddComponent<Image>();
        panelImage.color = new Color(0f, 0f, 0f, 0.5f);

        var layout = rootPanel.AddComponent<VerticalLayoutGroup>();
        layout.childAlignment = TextAnchor.UpperLeft;
        layout.spacing = 6f;
        layout.padding = new RectOffset(12, 12, 12, 12);

        var statusText = CreateLabel(rootPanel.transform, "StatusText", font, "Status");
        statusText.alignment = TextAnchor.MiddleLeft;
        statusText.raycastTarget = false;

        var modeText = CreateLabel(rootPanel.transform, "ModeText", font, "Mode: CardBluff");
        modeText.fontSize = 16;
        modeText.color = Color.cyan;
        modeText.raycastTarget = false;

        var scoreboard = CreateLabel(rootPanel.transform, "Scoreboard", font, "No patrons seated.");
        scoreboard.alignment = TextAnchor.UpperLeft;
        scoreboard.raycastTarget = false;

        CreateSpacer(rootPanel.transform, 12f);

        var bluffButton = CreateButton(rootPanel.transform, font, "Bluff", "BluffButton");
        var callButton = CreateButton(rootPanel.transform, font, "Call", "CallButton");
        var raiseButton = CreateButton(rootPanel.transform, font, "Raise", "RaiseButton");
        var drinkButton = CreateButton(rootPanel.transform, font, "Drink Poison", "DrinkButton");

        CreateSpacer(rootPanel.transform, 24f);

        var startCards = CreateButton(rootPanel.transform, font, "Start Card Bluff", "StartCardsButton");
        var startDice = CreateButton(rootPanel.transform, font, "Start Dice Bluff", "StartDiceButton");
        var lobbyLabel = CreateLabel(rootPanel.transform, "LobbyLabel", font, "Lobby empty.");
        lobbyLabel.alignment = TextAnchor.UpperLeft;
        lobbyLabel.raycastTarget = false;

        gameManager.InjectUiReferences(bluffButton, callButton, raiseButton, drinkButton, statusText, modeText, scoreboard);
        tabletopUi?.InjectDependencies(gameManager, startCards, startDice, lobbyLabel);
    }

    private bool HasExistingAssignments()
    {
        if (gameManager == null)
        {
            return false;
        }

        var type = typeof(GameManager);
        var field = type.GetField("bluffButton", BindingFlags.NonPublic | BindingFlags.Instance);
        if (field == null)
        {
            return false;
        }

        return field.GetValue(gameManager) != null;
    }

    private Canvas EnsureCanvas()
    {
        Canvas canvas = FindObjectOfType<Canvas>();
        if (canvas != null)
        {
            return canvas;
        }

        GameObject canvasGo = new GameObject("RuntimeCanvas");
        canvasGo.layer = LayerMask.NameToLayer("UI");
        canvas = canvasGo.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvasGo.AddComponent<CanvasScaler>().uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        canvasGo.AddComponent<GraphicRaycaster>();

        if (FindObjectOfType<EventSystem>() == null)
        {
            GameObject eventSystemGo = new GameObject("EventSystem");
            eventSystemGo.AddComponent<EventSystem>();
            eventSystemGo.AddComponent<StandaloneInputModule>();
        }

        return canvas;
    }

    private GameObject CreateUiObject(string name, Transform parent)
    {
        var go = new GameObject(name);
        go.transform.SetParent(parent, false);
        go.AddComponent<RectTransform>();
        return go;
    }

    private void CreateSpacer(Transform parent, float height)
    {
        var spacer = CreateUiObject("Spacer", parent);
        var layout = spacer.AddComponent<LayoutElement>();
        layout.minHeight = height;
        layout.flexibleHeight = 0f;
    }

    private Text CreateLabel(Transform parent, string name, Font font, string defaultText)
    {
        var labelGo = CreateUiObject(name, parent);
        var text = labelGo.AddComponent<Text>();
        text.font = font;
        text.fontSize = 18;
        text.color = Color.white;
        text.text = defaultText;
        text.horizontalOverflow = HorizontalWrapMode.Wrap;
        text.verticalOverflow = VerticalWrapMode.Overflow;
        return text;
    }

    private Button CreateButton(Transform parent, Font font, string label, string name)
    {
        var buttonGo = CreateUiObject(name, parent);
        var image = buttonGo.AddComponent<Image>();
        image.color = new Color(0.2f, 0.2f, 0.2f, 0.9f);

        var button = buttonGo.AddComponent<Button>();
        var colors = button.colors;
        colors.highlightedColor = new Color(0.3f, 0.3f, 0.3f, 1f);
        colors.pressedColor = new Color(0.1f, 0.1f, 0.1f, 1f);
        button.colors = colors;

        var text = CreateLabel(buttonGo.transform, "Text", font, label);
        var rect = text.rectTransform;
        rect.anchorMin = Vector2.zero;
        rect.anchorMax = Vector2.one;
        rect.offsetMin = Vector2.zero;
        rect.offsetMax = Vector2.zero;
        text.alignment = TextAnchor.MiddleCenter;

        var layout = buttonGo.AddComponent<LayoutElement>();
        layout.minHeight = 40f;

        return button;
    }
}
