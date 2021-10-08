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
    # plt.subplot(111)  # 第一个参数表示：行，第二个参数表示；列，第三个参数；当前图例中的激活位置
    plt.xlabel(u'X value')
    plt.ylabel(u'Y value')
    plt.title(u" First Order Plot", fontsize=16)
    # set the x,y limit of the output figure
    plt.xlim(observe_region[0], observe_region[1])
    plt.ylim(-3, 3)
    # note the important point
    plt.xticks(np.linspace(observe_region[0], observe_region[1], 9))
    # Used fot emphasizing the
    plt.axhline(y=0, xmax=0.5, color='r', linestyle='dashed')
    plt.axvline(x=0, ymax=0.5, color='r', linestyle='dashed')
    plt.plot(X, Y_x2)
    plt.show()


def plot_3D_functions_contour(g_n, x_range, y_range):
    plt.figure()
    ax3 = plt.axes(projection='3d')
    xx = np.arange(-2, 2, 0.1)
    yy = np.arange(-2, 2, 0.1)
    # X, Y = np.meshgrid(xx, yy)
    for i in yy:
        for a in xx:
            w = np.array([[i], [a]])
            Z = g_n(w)
    ax3.plot_surface(X, Y, Z, rstride=1, cstride=1, cmap='rainbow')
    plt.show()


if __name__ == '__main__':
    # Question a
    # G_a = lambda w: math.log(w / (1 - w))
    # Single_function_plot(G_a, [0.1, 0.99])

    # Question b
    # G_b = lambda w: np.exp(w) / (1 + np.exp(w))
    # Single_function_plot(G_b, [-50, 50])

    # Question c
    # G_c = lambda w: w - w * pow(np.tanh(w), 2) + np.tanh(w)
    # Single_function_plot(G_c, [-5, 5])

    # Question d
    C = np.array([[2, 1], [1, 3]])
    b = np.array([[1], [1]])
    G_d = lambda w: 1 / 2 * np.dot((C + C.T), w) + b.T
    plotter = static_plotter.Visualizer()

