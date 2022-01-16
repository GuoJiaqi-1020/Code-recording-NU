from mlrefined_libraries.math_optimization_library import static_plotter
from autograd import *
from autograd import numpy as np

plotter = static_plotter.Visualizer()


class normalized_gradient_decent:
    def __init__(self, function, w):
        self.fun = function
        self.ini_w = w

    def gradient_descent(self, normalized=False):
        gradient = value_and_grad(g)
        w = self.ini_w
        weight_his = []
        cost_his = []
        max_its = 100
        alpha = 0.1
        for k in range(1, max_its + 1):
            cost_eval, grad_eval = gradient(w)
            weight_his.append(w)
            cost_his.append(cost_eval)
            if normalized:
                grad_norm = np.linalg.norm(grad_eval)
                if grad_norm == 0:
                    grad_norm += 10 ** -6 * np.sign(2 * np.random.rand(1) - 1)
                grad_eval /= grad_norm
            else:
                grad_eval = grad_eval
            w = w - alpha * grad_eval
        weight_his.append(w)
        cost_his.append(self.fun(w))
        return weight_his, cost_his


if __name__ == '__main__':
    g = lambda w: np.tanh(4 * w[0] + 4 * w[1]) + max(0.4 * w[0] ** 2, 1) + 1
    w = np.array([2.0, 2.0])
    print(w)
    NGD = normalized_gradient_decent(g, w)
    weight1, cost1 = NGD.gradient_descent()
    weight2, cost2 = NGD.gradient_descent(normalized=True)

    plotter.plot_cost_histories(histories=[cost1, cost2], start=0,
                                labels=[r'$Standard$', r'$Fully Normalized$'],
                                title="Cost History of 100 Iterations"
                                )
