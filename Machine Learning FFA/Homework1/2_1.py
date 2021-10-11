from mlrefined_libraries.math_optimization_library import random_method_experiments
import numpy as np
import matplotlib.pyplot as plt

def minimum_value(N, P):
    G_w = []
    for i in range(N):
        result = (i + 1) * np.linspace(-1, 1, P) ** 2
        G_w.append(min(result))
    return G_w


def minimum_value_plot(X, Y, number_of_plot, label, color):
    plt.xlabel("Dimension/N")
    plt.ylabel("Minimum value of g(w)")
    plt.title("Minimum value attained for each quadratic against N")
    for i in range(number_of_plot):
        plt.plot(X, Y[i], color=color[i], linewidth=1, label=label[i])
    plt.legend(loc='upper left')
    plt.show()


if __name__ == '__main__':
    N = 100
    Y1 = minimum_value(100, 100)
    Y2 = minimum_value(100, 1000)
    Y3 = minimum_value(100, 10000)
    minimum_value_plot(range(1, N + 1), [Y1, Y2, Y3], number_of_plot=3, label=['P=100', 'P=1000', 'P=10000'],
                       color=['g', 'r', 'b'])
    # random_method_experiments.random_eval_experiment()
