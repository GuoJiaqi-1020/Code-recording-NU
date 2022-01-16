from mlrefined_libraries.math_optimization_library import static_plotter
from autograd import grad
from autograd import numpy as np

plotter = static_plotter.Visualizer()


class fixed_steplength():
    def __init__(self, function, Dim):
        self.fun = function
        self.ini_w = 10 * np.ones((Dim, 1))

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


if __name__ == '__main__':
    g = lambda w: np.dot(w.T, w)[0][0]
    FSG = fixed_steplength(g, 10)
    weight1, cost1 = FSG.gradient_descent(a=0.001)
    weight2, cost2 = FSG.gradient_descent(a=0.1)
    weight3, cost3 = FSG.gradient_descent(a=1)

    plotter.plot_cost_histories(histories=[cost3, cost2, cost1], start=0,
                                labels=[r'$\alpha = 1$', r'$\alpha = 10^{-1}$', r'$\alpha = 10^{-2}$'],
                                title="Cost History of 100 Iterations"
                                )
