import sys
import autograd.numpy as np
import autograd
from mlrefined_libraries.math_optimization_library import static_plotter
import matplotlib.pyplot as plt
plotter = static_plotter.Visualizer()
sys.path.append('../')


def model(x, w):
    a = w[0] + np.dot(x.T, w[1:])
    return a.T


def least_squares_mean(w):
    """
    Generate the cost function
    """
    cost = np.sum((model(x, w) - y) ** 2)
    return cost / float(np.size(y))


def gradient_decent(Loss_fun, study_rate, iteration, w):
    """
    Gradient decent
    """
    Gradient = autograd.grad(Loss_fun)
    weight_history = [w]
    cost_history = [Loss_fun(w)]
    for k in range(1, iteration + 1):
        grad_decent = Gradient(w)
        w = w - study_rate * grad_decent
        weight_history.append(w)
        cost_history.append(Loss_fun(w))
    return weight_history, cost_history, w


def linear_fitting_plot(x, y, w):
    """
    plot the scatter plot with the linear fitting line
    """
    x_axis = np.linspace(np.min(x), np.max(x))
    y_axis = w[0] + w[1] * x_axis

    plt.title('Linear Fit for Discrete Data Points')
    plt.xlabel('$log_{(mass)}\ (Kg)$')
    plt.ylabel('$log_{(metabolic rate)}\ (J)$')
    plt.plot(x_axis, y_axis, color='r')
    plt.scatter(x, y, color='b', edgecolor='w')

    plt.show()


if __name__ == "__main__":
    data = np.loadtxt('../mlrefined_datasets/superlearn_datasets/kleibers_law_data.csv', delimiter=',')
    x = np.log(data[:-1, :])
    y = np.log(data[-1:, :])
    # initialize the starting point
    w0 = np.random.randn(2, 1)  # mean 0 and The standard deviation = 1
    weight_history, cost_history, w = gradient_decent(Loss_fun=least_squares_mean, study_rate=0.005, iteration=1000,
                                                      w=w0)

    # Result visualization
    linear_fitting_plot(x, y, w)
    plotter.plot_cost_histories(histories=[cost_history], start=0, labels=['$ alpha = 0.005 $'],
                                title="Cost History of 1000 Iterations")
