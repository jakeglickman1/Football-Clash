#include <iostream>
#include <random>
#include <string>
#include <vector>

constexpr int LOWEST_VALUE = 1;
constexpr int HIGHEST_VALUE = 13;
constexpr int ROUNDS_TO_WIN = 10;
constexpr int LIVES = 2;

std::string prompt_for_guess() {
    std::string input;
    while (true) {
        std::cout << "Higher (H) or lower (L)? ";
        if (!std::getline(std::cin, input)) {
            return "";
        }
        for (auto& ch : input) {
            ch = static_cast<char>(std::tolower(static_cast<unsigned char>(ch)));
        }
        if (input == "h" || input == "l") {
            return input;
        }
        std::cout << "Please enter H for higher or L for lower.\n";
    }
}

std::vector<int> generate_sequence(std::mt19937& rng, int length) {
    std::uniform_int_distribution<int> dist(LOWEST_VALUE, HIGHEST_VALUE);
    std::vector<int> sequence;
    sequence.reserve(length);
    sequence.push_back(dist(rng));
    while (static_cast<int>(sequence.size()) < length) {
        int candidate = dist(rng);
        if (candidate != sequence.back()) {
            sequence.push_back(candidate);
        }
    }
    return sequence;
}

int main() {
    std::random_device rd;
    std::mt19937 rng(rd());

    std::cout << "Higher / Lower Guessing Game (C++ Edition)\n";
    std::cout << "Get " << ROUNDS_TO_WIN
              << " guesses right before losing both lives to win the challenge.\n\n";

    auto sequence = generate_sequence(rng, ROUNDS_TO_WIN + 1);
    int correct_guesses = 0;
    int lives_left = LIVES;

    while (correct_guesses < ROUNDS_TO_WIN && lives_left > 0) {
        int current = sequence[correct_guesses];
        int next_number = sequence[correct_guesses + 1];

        std::cout << "Current number: " << current << " (Lives left: " << lives_left
                  << ")\n";

        std::string guess = prompt_for_guess();
        if (guess.empty()) {
            break;
        }

        std::string relation = next_number > current ? "h" : "l";
        std::cout << "Next number: " << next_number << "\n";

        if (guess == relation) {
            ++correct_guesses;
            if (correct_guesses == ROUNDS_TO_WIN) {
                std::cout << "You got all 10 right! You win!\n";
            } else {
                std::cout << "Correct! " << (ROUNDS_TO_WIN - correct_guesses)
                          << " to go.\n\n";
            }
        } else {
            --lives_left;
            if (lives_left == 0) {
                std::cout << "Wrong again. You're out of lives. You lose.\n";
            } else {
                std::cout << "Wrong guess. Try again, but you're down to one life.\n\n";
            }
        }
    }

    return 0;
}
