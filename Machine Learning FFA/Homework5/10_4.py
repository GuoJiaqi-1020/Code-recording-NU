import numpy as np
import matplotlib.pyplot as plt
import pandas as pd


class Moores_law(object):
    def __init__(self, filename):
        data = np.asarray(pd.read_csv(filename, header=None))
        self.x = data[:, 0]
        self.x.shape = (len(self.x), 1)
        self.y = data[:, 1]
        self.y.shape = (len(self.y), 1)
        self.y_log = np.log(self.y)
        self.x_new = np.concatenate((np.ones(self.x.shape), self.x), axis=1)
        self.w = None

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

    def least_square_cost(self):
        A = 0
        b = 0
        for i in range(len(self.x)):
            A += np.outer(self.x_new[i, :], self.x_new[i, :].T)
            b += self.y_log[i] * self.x_new[i, :].T
        self.w = np.linalg.solve(A, b)

    def data_plotting(self, w):
        fig = plt.figure(figsize=(16, 5))
        ax1 = fig.add_subplot(1, 1, 1)  # panel for original space
        ax1.scatter(self.x, self.y, linewidth=3)
        s = np.linspace(np.min(self.x), np.max(self.x))
        t = np.exp(w[0] + w[1] * s)
        ax1.plot(s, t, linewidth=3, color='r')
        ax1.set_xlabel('x', fontsize=18)
        ax1.set_ylabel('y', rotation=90, fontsize=18)
        ax1.set_title('original space', fontsize=22)
        plt.show()


if __name__ == "__main__":
    filename = '../mlrefined_datasets/nonlinear_superlearn_datasets/transistor_counts.csv'
    Moores = Moores_law(filename)
    Moores.least_square_cost()
    Moores.data_plotting_linear_transform(Moores.w)
    Moores.data_plotting(Moores.w)
