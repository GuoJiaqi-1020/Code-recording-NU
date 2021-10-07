import matplotlib.pyplot as plt
import numpy as np
from matplotlib import font_manager
import math


def Single_function_plot(G):
    Y_x2 = []
    X = np.linspace(0.1, 0.99, 99)
    plt.figure(figsize=(6, 5))
    Y_x2 = [G(w) for w in X]
    plt.subplot(111)  # 第一个参数表示：行，第二个参数表示；列，第三个参数；当前图例中的激活位置
    plt.xlabel(u'X value')
    plt.ylabel(u'Y value')
    plt.title(u" First Order Plot", fontsize=16)
    # 设置X,Y轴的上下限
    plt.xlim(0.1, 0.5)
    plt.ylim(-3, 3)
    # 设置关键刻度
    plt.xticks(np.linspace(0.1, 0.9, 9))
    # # 添加文字,第一个参数是x轴坐标，第二个参数是y轴坐标，以数据的刻度为基准
    # plt.text(0.5, 0, "stationary point", fontdict={'size': '10', 'color': 'b'})
    # 添加标注。xy：标注箭头想要指示的点，xytext:描述信息的坐标
    plt.axhline(y=0, xmax=0.5, color='g', linestyle='dashed')
    plt.axvline(x=0.5, ymax=0.5, color='g', linestyle='dashed')
    # plt.annotate('stationary point', xy=(0.5, 0), xytext=(0.5, -4), fontsize=10,
    #              arrowprops=dict(facecolor='black', shrink=0.01))
    plt.plot(X, Y_x2)
    plt.show()


if __name__ == '__main__':
    G = lambda w: math.log(w / (1 - w))
    Single_function_plot(G)
