from mlrefined_libraries.math_optimization_library import static_plotter


def gradient_decent(G, Gradient, study_rate, iteration, w):
    cost = []
    for k in range(1, iteration + 1):
        grad_eval = Gradient(w)
        w -= study_rate * grad_eval
        cost.append(G(w))
    return cost


if __name__ == '__main__':
    iteration = 1000
    w = 2
    G = lambda w: 1 / 50 * (w ** 4 + w ** 2 + 10 * w)
    delta_G = lambda w: 1 / 50 * (4 * w ** 3 + w * 2 + 10)
    study_rate = [1, 0.1, 0.01]
    cost1 = gradient_decent(G, delta_G, study_rate[0], iteration, w)
    cost2 = gradient_decent(G, delta_G, study_rate[1], iteration, w)
    cost3 = gradient_decent(G, delta_G, study_rate[2], iteration, w)
    plotter = static_plotter.Visualizer()
    plotter.plot_cost_histories(histories=[cost1, cost2, cost3], start=0,
                                labels=[r'$\alpha = 1$', r'$\alpha = 10^{-1}$', r'$\alpha = 10^{-2}$'],
                                title="Cost History of 1000 Iterations"
                                )
