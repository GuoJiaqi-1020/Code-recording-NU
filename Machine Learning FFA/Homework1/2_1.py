import mlrefined_libraries
from mlrefined_libraries.math_optimization_library import random_method_experiments
from mlrefined_libraries import math_optimization_library as optlib
import numpy as np
import matplotlib.pyplot as plt


def uniform_sample(P):
    w = np.linspace(start, stop, P)
    g = w.T*w
    plt.figure(figsize=(9, 6))
    plt.plot(w, g)
    plt.title(u" N=1 P=100 ", fontsize=16)
    plt.xlabel('w')
    plt.ylabel('g(w)= w^T*w')
    plt.plot(w, w * 0, linewidth=1, linestyle='-.', color='g')
    plt.show()

# def plot_3_picture(P):


if __name__ == '__main__':
    N = 100
    P = [100, 1000, 10000]
    start = -1
    stop = 1
    uniform_sample(P[0])
    # random_method_experiments.random_eval_experiment()
