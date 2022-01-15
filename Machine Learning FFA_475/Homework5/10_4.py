import numpy as np
import pandas as pd
import autograd.numpy as np
from autograd import hessian, grad
import matplotlib.pyplot as plt


class Moores_law(object):
    def __init__(self, filename):
        data = np.asarray(pd.read_csv(filename, header=None))
        self.x = data[:, 0]
        self.x.shape = (1, len(self.x))
        self.y = data[:, 1]
        self.y.shape = (1, len(self.y))
        self.y_log = np.log(self.y)

    def data_plotting_linear_transform(self, w):
        fig = plt.figure(figsize=(16, 5))
        ax1 = fig.add_subplot(1, 1, 1)  # panel for original space
        ax1.scatter(self.x, self.y_log, linewidth=3)
        s = np.linspace(np.min(self.x), np.max(self.x))
        t = w[0] + w[1] * s
        ax1.plot(s, t, linewidth=3, color='r')
        ax1.set_xlabel('x', fontsize=16)
        ax1.set_ylabel('log(y)', rotation=90, fontsize=16)
        ax1.set_title('Linear Relationship', fontsize=22)
        plt.show()

    @staticmethod
    def model(x, w):
        a = w[0] + np.dot(x.T, w[1:])
        return a.T

    def least_squares_mean(self, w):
        cost = np.sum((self.model(self.x, w) - self.y_log) ** 2)
        return cost / float(np.size(self.y_log))

    def newtons_method(self, g, max_its, w, **kwargs):
        gradient = grad(g)
        hess = hessian(g)

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
        self.w = w
        return weight_history, cost_history

    def data_plotting(self, w):
        fig = plt.figure(figsize=(16, 5))
        ax1 = fig.add_subplot(1, 1, 1)  # panel for original space
        ax1.scatter(self.x, self.y, linewidth=3)
        s = np.linspace(np.min(self.x), np.max(self.x))
        t = np.exp(w[0] + w[1] * s)
        ax1.plot(s, t, linewidth=3, color='r')
        ax1.set_xlabel('x', fontsize=18)
        ax1.set_ylabel('y', rotation=90, fontsize=18)
        ax1.set_title('Fitting Result', fontsize=22)
        plt.show()


if __name__ == "__main__":
    filename = '../mlrefined_datasets/nonlinear_superlearn_datasets/transistor_counts.csv'
    w0 = np.random.randn(2, 1)
    Moores = Moores_law(filename)
    Moores.newtons_method(Moores.least_squares_mean, max_its=1000, w=w0)
    Moores.data_plotting_linear_transform(Moores.w)
    Moores.data_plotting(Moores.w)
