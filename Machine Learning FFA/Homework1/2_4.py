import mlrefined_libraries
from mlrefined_libraries.math_optimization_library import random_method_experiments
from mlrefined_libraries.math_optimization_library import static_plotter
import numpy as np


def random_search(g, alpha_choice, max_its, w, num_samples):
    weight_history = []  # container for weight history
    cost_history = []
    alpha = 0
    for k in range(1, max_its + 1):
        if alpha_choice == 'diminishing':
            alpha = 1 / float(k)
        else:
            alpha = alpha_choice

        # record weights and cost evaluation
        weight_history.append(w)
        cost_history.append(g(w))

        # construct set of random unit directions
        directions = np.random.randn(num_samples, np.size(w))
        norms = np.sqrt(np.sum(directions * directions, axis=1))[:, np.newaxis]
        directions = directions / norms

        ### pick best descent direction
        # compute all new candidate points
        w_candidates = w + alpha * directions

        # evaluate all candidates
        evals = np.array([g(w_val) for w_val in w_candidates])
        # if we find a real descent direction take the step in its direction
        ind = np.argmin(evals)
        if g(w_candidates[ind]) < g(w):
            # pluck out best descent direction
            d = directions[ind, :]

            # take step
            w = w + alpha * d

    # record weights and cost evaluation
    weight_history.append(w)
    cost_history.append(g(w))
    return weight_history, cost_history


if __name__ == '__main__':
    g = lambda w: 100 * (w[1] - w[0] ** 2) ** 2 + (w[0] - 1) ** 2
    a = 1
    w = np.array([-2, -2])
    P = 1000
    K = 50
    weight_history_1, cost_history_1 = random_search(g, a, K, w, P)
    plotter = static_plotter.Visualizer()
    plotter.two_input_contour_plot(g, weight_history_1, num_contours=35, xmin=-2.5, xmax=2.5, ymin=-2.25, ymax=2)

    # random search program
    weight_history_2, cost_history_2 = random_search(g, 'diminishing', K, w, P)
    plotter.compare_runs_contour_plots(g, [weight_history_1, weight_history_2], num_contours=35, xmin=-2.5, xmax=2.5,
                                       ymin=-2.25, ymax=2, show_original=False)
