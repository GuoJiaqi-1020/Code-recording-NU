from mlrefined_libraries.math_optimization_library import static_plotter
from autograd import *
from autograd import numpy as np

plotter = static_plotter.Visualizer()


class normalized_gradient_decent:
    def __init__(self, function, w):
        self.fun = function
        self.ini_w = w

    def gradient_descent(self, normalized=None, max_its=100):
        gradient = value_and_grad(g)
        w = self.ini_w
        weight_his = []
        cost_his = []

        alpha = 0.1
        for k in range(1, max_its + 1):
            cost_eval, grad_eval = gradient(w)
            weight_his.append(w)
            cost_his.append(cost_eval)
            if normalized == "full":
                grad_norm = np.linalg.norm(grad_eval)
                if grad_norm == 0:
                    grad_norm += 10 ** -6 * np.sign(2 * np.random.rand(1) - 1)
                grad_eval /= grad_norm
            elif normalized == "Component-wise":
                component_norm = np.abs(grad_eval) + 10 ** (-8)
                grad_eval /= component_norm
            else:
                grad_eval = grad_eval
            w = w - alpha * grad_eval
        weight_his.append(w)
        cost_his.append(self.fun(w))
        return weight_his, cost_his


if __name__ == '__main__':
    g = lambda w: np.max(np.tanh(4 * w[0] + 4 * w[1]), 0) + np.max(np.abs(0.4 * w[0]), 0) + 1
    w = np.array([2.0, 2.0])
    max_its = 1000
    print(w)
    NGD = normalized_gradient_decent(g, w)
    weight1, cost1 = NGD.gradient_descent(max_its=max_its)
    weight2, cost2 = NGD.gradient_descent(normalized="Component-wise", max_its=max_its)
    weight3, cost3 = NGD.gradient_descent(normalized="full", max_its=max_its)

    plotter.plot_cost_histories(histories=[cost1, cost2, cost3], start=0,
                                labels=[r'$Standard$', r'Component-wise', r'Fully Normalized'],
                                title="Cost History of {} Iterations".format(max_its)
                                )
