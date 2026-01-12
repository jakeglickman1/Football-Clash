using System.Collections.Generic;
using UnityEngine;

#if UNITY_NETCODE
using Unity.Netcode;
#endif

/// <summary>
/// Bridges Netcode for GameObjects events with the local GameManager so players
/// are registered/unregistered automatically when clients connect or disconnect.
/// Also disables the debug truth readout once a network session is active.
/// </summary>
public class NetcodeLobbyAdapter : MonoBehaviour
{
    [SerializeField] private GameManager gameManager;

#if UNITY_NETCODE
    private void Awake()
    {
        if (gameManager == null)
        {
            gameManager = FindObjectOfType<GameManager>();
        }
    }

    private void OnEnable()
    {
        var networkManager = NetworkManager.Singleton;
        if (networkManager == null)
        {
            Debug.LogWarning("NetcodeLobbyAdapter: No NetworkManager singleton found.");
            return;
        }

        networkManager.OnClientConnectedCallback += HandleClientConnected;
        networkManager.OnClientDisconnectCallback += HandleClientDisconnected;
        networkManager.OnServerStarted += HandleServerStarted;
        networkManager.OnServerStopped += HandleServerStopped;

        if (networkManager.IsServer || networkManager.IsClient)
        {
            HandleServerStarted();
        }
    }

    private void OnDisable()
    {
        var networkManager = NetworkManager.Singleton;
        if (networkManager == null)
        {
            return;
        }

        networkManager.OnClientConnectedCallback -= HandleClientConnected;
        networkManager.OnClientDisconnectCallback -= HandleClientDisconnected;
        networkManager.OnServerStarted -= HandleServerStarted;
        networkManager.OnServerStopped -= HandleServerStopped;
    }

    private void HandleServerStarted()
    {
        if (gameManager == null)
        {
            return;
        }

        gameManager.SetTruthDebug(false);

        foreach (var kvp in NetworkManager.Singleton.ConnectedClients)
        {
            RegisterClient(kvp.Key);
        }
    }

    private void HandleServerStopped(bool _)
    {
        if (gameManager == null)
        {
            return;
        }

        var snapshot = new List<PlayerController>(gameManager.Players);
        foreach (var player in snapshot)
        {
            gameManager.UnregisterPlayer(player);
        }

        gameManager.SetTruthDebug(true);
    }

    private void HandleClientConnected(ulong clientId)
    {
        RegisterClient(clientId);
    }

    private void HandleClientDisconnected(ulong clientId)
    {
        if (gameManager == null)
        {
            return;
        }

        var networkManager = NetworkManager.Singleton;
        if (networkManager == null)
        {
            return;
        }

        if (networkManager.ConnectedClients.TryGetValue(clientId, out var client))
        {
            if (client.PlayerObject != null && client.PlayerObject.TryGetComponent<PlayerController>(out var controller))
            {
                gameManager.UnregisterPlayer(controller);
            }
        }
    }

    private void RegisterClient(ulong clientId)
    {
        if (gameManager == null)
        {
            return;
        }

        var networkManager = NetworkManager.Singleton;
        if (networkManager == null)
        {
            return;
        }

        if (!networkManager.ConnectedClients.TryGetValue(clientId, out var client))
        {
            return;
        }

        if (client.PlayerObject == null)
        {
            return;
        }

        if (client.PlayerObject.TryGetComponent<PlayerController>(out var controller))
        {
            gameManager.RegisterPlayer(controller);
        }
    }
#else
    private void Awake()
    {
        if (gameManager == null)
        {
            gameManager = FindObjectOfType<GameManager>();
        }

        Debug.LogWarning("NetcodeLobbyAdapter present but UNITY_NETCODE is not defined. Add Netcode for GameObjects to enable networking integration.");
    }
#endif
}
