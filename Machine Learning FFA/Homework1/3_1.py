import matplotlib.pyplot as plt
import numpy as np
from mlrefined_libraries.math_optimization_library import static_plotter
from matplotlib import font_manager
import math


def Single_function_plot(G_n, observe_region):
    """
    Use to draw the function and found the zero point
    :param G_n: G_n indicate the function that you want to depict 
    :param observe_region: this should be a 1×2 list, represent the two boundaries of the function
    :return: None
    """
    X = np.linspace(observe_region[0], observe_region[1], 100)
    plt.figure(figsize=(6, 5))
    Y_x2 = [G_n(w) for w in X]
    # plt.subplot(111)
    plt.xlabel(u'X value')
    plt.ylabel(u'Y value')
    plt.title(u" G_w ", fontsize=16)
    # set the x,y limit of the output figure
    plt.xlim(observe_region[0], observe_region[1])
    plt.ylim(-1, 5)
    # note the important point
    plt.xticks(np.linspace(observe_region[0], observe_region[1], 10))
    # Emphasize the import point
    # plt.axhline(y=0, color='r', linestyle='dashed')
    # plt.axvline(x=0.5, color='r', linestyle='dashed')
    plt.plot(X, Y_x2)
    plt.show()


def plot_3D_functions_contour(g_n):
    """
    Draw the 3D function surface
    :param g_n: The functions that you want to plot, it should have three dimensions, X,Y,Z.
    :return: None
    """
    plt.figure()
    Z = []
    ax3 = plt.axes(projection='3d')
    xx = np.arange(-5, 5, 0.05)
    yy = np.arange(-5, 5, 0.05)
    X, Y = np.meshgrid(xx, yy)
    for i in yy:
        for a in xx:
            w = np.array([[i], [a]])
            Z.append(int(g_n(w)))
    matrix_size = int(math.sqrt(X.size))
    Z = np.resize(Z, (matrix_size, matrix_size))
    ax3.plot_surface(X, Y, Z, rstride=1, cstride=1, cmap='rainbow')
    plt.show()


if __name__ == '__main__':
    # Question a
    G_a = lambda w: w*math.log(w)+(1-w)*math.log(1-w)
    Single_function_plot(G_a, [0.1, 0.99])

    # Question b
    # G_b = lambda w: math.log(1 + pow(math.e, w))
    # Single_function_plot(G_b, [-50, 30])

    # Question c
    # G_c = lambda w: w*math.tanh(w)
    # Single_function_plot(G_c, [-5, 5])

    # Question d
    # C = np.array([[2, 1], [1, 3]])
    # b = np.array([[1], [1]])
    # G_d = lambda w: 1 / 2 * np.dot(np.dot(w.T, C), w) + np.dot(b.T, w)
    # plot_3D_functions_contour(G_d)
