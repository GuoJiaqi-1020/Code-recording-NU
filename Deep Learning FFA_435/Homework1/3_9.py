from mlrefined_libraries.math_optimization_library import static_plotter

from mlrefined_libraries.math_optimization_library import static_plotter
from autograd import *
from autograd import numpy as np

plotter = static_plotter.Visualizer()


class momentum_gradient_decent:
    def __init__(self, function, w):
        self.fun = function
        self.ini_w = w

    def gradient_descent(self, a):
        w = self.ini_w
        max_its = 100
        gradient = grad(self.fun)
        weight_his = [w]
        cost_his = [self.fun(w)]
        for k in range(max_its):
            grad_eval = gradient(w)
            w = w - a * grad_eval
            weight_his.append(w)
            cost_his.append(self.fun(w))
        return weight_his, cost_his

    def momentum(self, beta):
        w = self.ini_w
        max_its = 25
        gradient = value_and_grad(self.fun)
        weight_history = []
        cost_history = []
        a = 0.1
        h = np.zeros(w.shape)
        for k in range(1, max_its + 1):
            cost_eval, grad_eval = gradient(w)
            weight_history.append(w)
            cost_history.append(cost_eval)
            h = beta * h - (1 - beta) * grad_eval
            w = w + a * h
        weight_history.append(w)
        cost_history.append(self.fun(w))
        return weight_history, cost_history


if __name__ == '__main__':
    g = lambda w: (np.dot(0 * np.ones((2, 1)).T, w) + np.dot(np.dot(w.T, np.array([[0.5, 0], [0, 9.75]])), w))[0]
    MGD = momentum_gradient_decent(g, np.array([10.0, 1.0]))
    weight1, cost1 = MGD.momentum(beta=0)
    weight2, cost2 = MGD.momentum(beta=0.2)
    weight3, cost3 = MGD.momentum(beta=0.7)
    his = [weight1, weight2, weight3]
    gs = [g, g, g]
    plotter.two_input_contour_vert_plots(title=r"Zig-zagging Behavior for $\beta=0, 0.2, 0.7$", gs=gs, histories=his,
                                         num_contours=30, xmin=-1, xmax=11,
                                         ymin=-2.0,
                                         ymax=2)
    plotter.plot_cost_histories(histories=[cost1, cost2, cost3], start=0,
                                labels=[r'$\beta = 0$', r'$\beta = 0.2$', r'$\beta = 0.7$'],
                                title=r"Cost History of 25 Iterations, with different $\beta$"
                                )
