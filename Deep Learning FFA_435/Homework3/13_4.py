import sys
import autograd.numpy as np
from matplotlib import pyplot as plt, gridspec
from mlrefined_libraries.multilayer_perceptron_library.basic_lib.unsuper_setup import history_plotters
from mlrefined_libraries.multilayer_perceptron_library.basic_lib import multilayer_perceptron, unsuper_cost_functions, \
    unsuper_optimizers

sys.path.append('../')


class Nonlinear_Autoencoder():
    def __init__(self, filename, layer_size):
        data = np.loadtxt(filename, delimiter=",")
        self.encoder = layer_size
        self.decoder = list(reversed(layer_size))
        self.x = data
        # define the parameter
        self.weight_histories = []
        self.train_cost_histories = []
        self.train_accuracy_histories = []
        self.val_cost_histories = []
        self.val_accuracy_histories = []
        self.train_costs = []
        self.train_counts = []
        self.val_costs = []
        self.val_counts = []

        self.plot_origin_dataset()
        # training process

        self.data_preprocess()
        self.split_dataset(train_portion=1)
        self.choose_encoder(layer_sizes=self.encoder, scale=0.2)
        self.choose_decoder(layer_sizes=self.decoder, scale=0.2)
        self.choose_cost(name='autoencoder')
        self.fit()
        self.show_histories()

    def normalize(self, x):
        x_means = np.mean(x, axis=1)[:, np.newaxis]
        x_stds = np.std(x, axis=1)[:, np.newaxis]
        ind = np.argwhere(x_stds < 10 ** (-2))
        if len(ind) > 0:
            ind = [v[0] for v in ind]
            adjust = np.zeros(x_stds.shape)
            adjust[ind] = 1.0
            x_stds += adjust
        self.normalizer = lambda data: (data - x_means) / x_stds

    def data_preprocess(self):
        self.normalize(self.x)
        self.x = self.normalizer(self.x)

    def split_dataset(self, train_portion):
        self.train_portion = train_portion
        r = np.random.permutation(self.x.shape[1])
        train_num = int(np.round(train_portion * len(r)))
        self.train_inds = r[:train_num]
        self.val_inds = r[train_num:]
        self.x_train = self.x[:, self.train_inds]
        self.x_val = self.x[:, self.val_inds]

    def choose_encoder(self, **kwargs):
        transformer = multilayer_perceptron.Setup(**kwargs)
        self.feature_transforms = transformer.feature_transforms
        self.initializer_1 = transformer.initializer

    def choose_decoder(self, **kwargs):
        transformer = multilayer_perceptron.Setup(**kwargs)
        self.feature_transforms_2 = transformer.feature_transforms
        self.initializer_2 = transformer.initializer

    def choose_cost(self, name, **kwargs):
        self.cost_object = unsuper_cost_functions.Setup(name, **kwargs)
        self.cost_object.define_encoder_decoder(self.feature_transforms, self.feature_transforms_2)
        self.cost = self.cost_object.cost
        self.cost_name = name
        self.encoder = self.cost_object.encoder
        self.decoder = self.cost_object.decoder

    def fit(self, **kwargs):
        max_its = 1500
        alpha_choice = 10 ** (-1)
        self.w_init_1 = self.initializer_1()
        self.w_init_2 = self.initializer_2()
        self.w_init = [self.w_init_1, self.w_init_2]

        # batch size for gradient descent?
        self.train_num = np.shape(self.x_train)[1]
        self.val_num = np.shape(self.x_val)[1]
        self.batch_size = np.shape(self.x_train)[1]

        # run gradient descent
        weight_history, train_cost_history, val_cost_history = unsuper_optimizers.gradient_descent(self.cost,
                                                                                                   self.w_init,
                                                                                                   self.x_train,
                                                                                                   self.x_val,
                                                                                                   alpha_choice,

                                                                                                   max_its,
                                                                                                   self.batch_size,
                                                                                                   verbose=False)

        # store all new histories
        self.weight_histories.append(weight_history)
        self.train_cost_histories.append(train_cost_history)
        self.val_cost_histories.append(val_cost_history)

    def plot_fun(self, train_cost_histories, train_accuracy_histories, val_cost_histories, val_accuracy_histories,
                 start):
        fig = plt.figure(figsize=(15, 4.5))
        gs = gridspec.GridSpec(1, 2)
        ax1 = plt.subplot(gs[0])
        ax2 = plt.subplot(gs[1])
        for c in range(len(train_cost_histories)):
            train_cost_history = train_cost_histories[c]
            train_accuracy_history = train_accuracy_histories[c]
            val_cost_history = val_cost_histories[c]
            val_accuracy_history = val_accuracy_histories[c]
            ax1.plot(np.arange(start, len(train_cost_history), 1), train_cost_history[start:],
                     linewidth=3 * 0.6 ** c, color=self.colors[1])
            ax2.plot(np.arange(start, len(train_accuracy_history), 1), train_accuracy_history[start:],
                     linewidth=3 * 0.6 ** c, color=self.colors[1], label='Training set')
            if np.size(val_cost_history) > 0:
                ax1.plot(np.arange(start, len(val_cost_history), 1), val_cost_history[start:],
                         linewidth=3 * 0.8 ** c, color=self.colors[1])
                ax2.plot(np.arange(start, len(val_accuracy_history), 1), val_accuracy_history[start:],
                         linewidth=3 * 0.8 ** c, color=self.colors[1], label='validation')
        xlabel = 'Step $k$'
        ylabel = r'$g\left({\mathbf{\Theta}}^k\right)$'
        ax1.set_xlabel(xlabel, fontsize=14)
        ax1.set_ylabel(ylabel, fontsize=14, rotation=0, labelpad=25)
        title = 'Cost History'
        ax1.set_title(title, fontsize=15)
        ylabel = 'Accuracy'
        ax2.set_xlabel(xlabel, fontsize=14)
        ax2.set_ylabel(ylabel, fontsize=14, rotation=90, labelpad=10)
        title = 'Accuracy History'
        ax2.set_title(title, fontsize=15)
        anchor = (1, 1)
        plt.legend(loc='lower right')  # bbox_to_anchor=anchor)
        ax1.set_xlim([start - 0.5, len(train_cost_history) - 0.5])
        ax2.set_xlim([start - 0.5, len(train_cost_history) - 0.5])
        ax2.set_ylim([0, 1.05])
        plt.show()

    def plot_hist(self):
        start = 0
        if self.train_portion == 1:
            self.val_cost_histories = [[] for s in range(len(self.val_cost_histories))]
            self.val_accuracy_histories = [[] for s in range(len(self.val_accuracy_histories))]
        self.plot_fun(self.train_cost_histories, self.train_accuracy_histories, self.val_cost_histories,
                      self.val_accuracy_histories, start)

    def plot_origin_dataset(self):
        X = self.x
        fig = plt.figure(figsize=(9, 4))
        gs = gridspec.GridSpec(1, 1)
        ax = plt.subplot(gs[0], aspect='equal')
        ax.set_xlabel(r'$x_1$', fontsize=15)
        ax.set_ylabel(r'$x_2$', fontsize=15)
        ax.scatter(X[0, :], X[1, :], c='k', s=60, linewidth=0.75, edgecolor='w')
        plt.show()

    def show_histories(self, **kwargs):
        start = 0
        if 'start' in kwargs:
            start = kwargs['start']
        if self.train_portion == 1:
            self.val_cost_histories = [[] for s in range(len(self.val_cost_histories))]
            self.val_accuracy_histories = [[] for s in range(len(self.val_accuracy_histories))]
        history_plotters.Setup(self.train_cost_histories, self.train_accuracy_histories, self.val_cost_histories,
                               self.val_accuracy_histories, start)


if __name__ == "__main__":
    datapath = '../mlrefined_datasets/nonlinear_superlearn_datasets/universal_autoencoder_samples.csv'
    layer_sizes = [2, 10, 10, 1]
    NA = Nonlinear_Autoencoder(datapath, layer_sizes)
