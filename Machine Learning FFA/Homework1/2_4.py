from mlrefined_libraries.math_optimization_library import static_plotter
import numpy as np


def random_search(G_w, study_rate, max_its, ini_w, num_new_directions, decent_method=None):
    """
    This function will seek out a decent direction at each step by examining a number of random directions stemming
    from our current point.
    :param G_w: The function that you want to minimize
    :param study_rate: The step length each iteration will take(only if decent_method = None)
    :param max_its: The total iteration
    :param ini_w: The coordinates of the point at which the Nth recurrence begins
    :param num_new_directions: Number of randomly sampled directions at each decent iteration
    :param decent_method: Implementation of random decent with a diminishing step length
    :return: a record of cost and weight history
    """
    weight_history = []  # container for weight history
    cost_history = []
    for k in range(1, max_its + 1):
        if decent_method == 'diminishing':
            alpha = 1 / float(k)
        else:
            alpha = study_rate

        weight_history.append(ini_w)
        cost_history.append(G_w(ini_w))
        # generate random unit direction
        directions = generate_random_direction(num_new_directions, ini_w)
        all_new_w = ini_w + alpha * directions

        # Compare all new points, and pick the smallest one, get its index and output
        small_val_ind = np.argmin(np.array([G_w(sample_direction) for sample_direction in all_new_w]))
        if G_w(all_new_w[small_val_ind]) < G_w(ini_w):
            # determine the best decent direction
            d = directions[small_val_ind, :]
            ini_w = ini_w + alpha * d

    # record weight and cost
    weight_history.append(ini_w)
    cost_history.append(G_w(ini_w))
    return weight_history, cost_history


def generate_random_direction(num_new_directions, ini_w):
    # This function will generate a set of unit direction vectors subject to normal distribution
    directions = np.random.randn(num_new_directions, np.size(ini_w))
    norms = np.sqrt(np.sum(directions * directions, axis=1))[:, np.newaxis]
    directions = directions / norms
    return directions


if __name__ == '__main__':
    plotter = static_plotter.Visualizer()
    w_0 = np.array([-2, -2])
    G_w = lambda w: 100 * (w[1] - w[0] ** 2) ** 2 + (w[0] - 1) ** 2
    a = 1
    P = 1000
    K = 50
    weight_history_1, cost_history_1 = random_search(G_w, a, K, w_0, P)
    weight_history_2, cost_history_2 = random_search(G_w, a, K, w_0, P, decent_method='diminishing')
    plotter.compare_runs_contour_plots(G_w, [weight_history_1, weight_history_2], num_contours=30, xmin=-3, xmax=3,
                                       ymin=-3, ymax=2, show_original=False)

    # Draw the cost history
    # plotter.plot_cost_histories(histories=[cost_history_1, cost_history_2], start=25,
    #                             labels=[r'$ uniform\ step\ length = 1$', r'$ diminishing\ step\ length = 1/k$'])
