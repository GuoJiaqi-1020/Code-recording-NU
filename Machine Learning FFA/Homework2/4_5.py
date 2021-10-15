from autograd import grad
from autograd import hessian
from mlrefined_libraries.math_optimization_library import static_plotter
import numpy as np


# newtons method function - inputs: g (input function), max_its (maximum number of iterations), w (initialization)
def newtons_method(g, gradient, hess, max_its, w, **kwargs):
    # compute gradient module using autograd
    # gradient = grad(g)
    # hess = hessian(g)

    # set numericxal stability parameter / regularization parameter
    epsilon = 10 ** (-10)
    if 'epsilon' in kwargs:
        epsilon = kwargs['epsilon']

    # run the newtons method loop
    weight_history = [np.array(w)]  # container for weight history
    cost_history = [np.array(g(w))]  # container for corresponding cost function history
    for k in range(max_its):
        # evaluate the gradient and hessian
        grad_eval = gradient(w)
        hess_eval = hess(w)

        # reshape hessian to square matrix for numpy linalg functionality
        hess_eval.shape = (int((np.size(hess_eval)) ** (0.5)), int((np.size(hess_eval)) ** (0.5)))

        # solve second order system system for weight update
        A = hess_eval + epsilon * np.eye(w.size)
        b = grad_eval
        w = np.linalg.solve(A, np.dot(A, w) - b)

        # record weight and cost
        weight_history.append(np.array(w))
        cost_history.append(np.array(g(w)))
    return weight_history, cost_history


if __name__ == "__main__":
    dimension = 2
    g = lambda w: np.log(1 + np.exp(np.dot(w.T, w)))
    g_gradient = lambda w: (2 * w * np.exp(np.dot(w.T, w))) / (1 + np.exp(np.dot(w.T, w)))
    g_hessian = lambda w: np.dot((2 * np.exp(np.dot(w.T, w))) / (1 + np.exp(np.dot(w.T, w))), np.identity(dimension)) \
                          + (4 * np.dot(w, w.T) * np.exp(np.dot(w.T, w))) / ((1 + np.exp(np.dot(w.T, w))) ** 2)
    w0 = np.ones((dimension,), dtype=float)
    w0_ = 4 * np.ones((dimension,), dtype=float)
    max_its = 10
    weight_history, cost_history = newtons_method(g, g_gradient, g_hessian, max_its, w0)
    weight_history2, cost_history2 = newtons_method(g, g_gradient, g_hessian, max_its, w0_)
    plotter = static_plotter.Visualizer()
    plotter.plot_cost_histories(histories=[cost_history, cost_history2], start=0,
                                labels=[r'$w^0 = 1$', r'$w^0 = 4$'],
                                title="Cost History of 10 Iterations")
    plotter.compare_runs_contour_plots(g, [weight_history, weight_history2], num_contours=30, xmin=-1, xmax=4.2,
                                       ymin=-1, ymax=4.2, show_original=False)
