using System;
using System.Collections;
using UnityEngine;

/// <summary>
/// Simple cinematic placeholder for Russian Roulette. Replace with timeline or animation later.
/// </summary>
public class RussianRoulette : MonoBehaviour
{
    [SerializeField] private float spinDuration = 2f;
    [SerializeField] private float pauseBeforeShot = 1f;
    [SerializeField] private AudioSource revolverAudio;
    [SerializeField] private AudioClip spinClip;
    [SerializeField] private AudioClip shotClip;
    [SerializeField] private AudioClip clickClip;

    public void PlaySequence(PlayerController target, Action<PlayerController, bool> onComplete)
    {
        if (target == null)
        {
            Debug.LogWarning("No target for Russian Roulette");
            onComplete?.Invoke(null, true);
            return;
        }

        StartCoroutine(RunRoulette(target, onComplete));
    }

    private IEnumerator RunRoulette(PlayerController target, Action<PlayerController, bool> onComplete)
    {
        PlaySfx(spinClip);
        yield return new WaitForSeconds(spinDuration);

        target.ReactToBluff(true);
        yield return new WaitForSeconds(pauseBeforeShot);

        bool survived = EvaluateShot();
        PlaySfx(survived ? clickClip : shotClip);

        onComplete?.Invoke(target, survived);
    }

    private bool EvaluateShot()
    {
        int liveChamber = UnityEngine.Random.Range(0, 6);
        int firedChamber = UnityEngine.Random.Range(0, 6);
        return liveChamber != firedChamber;
    }

    private void PlaySfx(AudioClip clip)
    {
        if (revolverAudio == null || clip == null)
        {
            return;
        }

        revolverAudio.PlayOneShot(clip);
    }
}
