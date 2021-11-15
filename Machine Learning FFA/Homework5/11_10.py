import copy
from autograd import value_and_grad
from autograd.misc.flatten import flatten_func
import autograd.numpy as np
import matplotlib.pyplot as plt
from IPython.display import clear_output
from mlrefined_libraries.nonlinear_superlearn_library.kfolds_reg_lib.superlearn_setup import Setup


class Diabetes_Classification(Setup):
    def __init__(self, file_path, K_fold):
        data = np.loadtxt(file_path, delimiter=',')
        self.x = data[:-1, :]
        self.y = data[-1:, :]
        super().__init__(self.x, self.y)
        self.fold_num = self.fold_assigning(self.y.size, K_fold)
        self.x_mean = np.nanmean(self.x, axis=1)[:, np.newaxis]
        self.x_std = np.nanstd(self.x, axis=1)[:, np.newaxis]
        self.K_fold = K_fold
        self.lam = None

    def decent_ini(self):
        self.w_0 = 0.1 * np.random.randn(self.x.shape[0] + 1, 1)

    @staticmethod
    def fold_assigning(L, K):
        order = np.random.permutation(L)
        c = np.ones((L, 1))
        L = int(np.round((1 / K) * L))
        for s in np.arange(0, K - 2):
            c[order[s * L:(s + 1) * L]] = s + 2
        c[order[(K - 1) * L:]] = K
        return c

    def data_initialization(self):
        self.deviation_regulartor(self.x)
        x = self.data_recovery(self.x)
        self.x_mean = np.nanmean(x, axis=1)[:, np.newaxis]
        self.data_normalization(x)

    def deviation_regulartor(self, x):
        self.x_std = np.nanstd(x, axis=1)[:, np.newaxis]
        regulator = np.zeros(self.x_std.shape)
        for i in range(len(self.x_std)):
            if self.x_std[i] <= 0.01:
                regulator[i] = 1.0
                self.x_std += regulator
            else:
                pass

    def data_normalization(self, x):
        # Generate the normalization function
        normalize = lambda x: (x - self.x_mean) / self.x_std
        self.x = normalize(x)

    def data_recovery(self, x):
        mean = np.nanmean(self.x, axis=1)
        for i in np.argwhere(np.isnan(x)):
            x[i[0], i[1]] = mean[i[0]]
        return x

    @staticmethod
    def linear_model(x, w):
        a = w[0] + np.dot(x.T, w[1:])
        return a.T

    def make_train_test_split(self, k):
        train_ind = [v[0] for v in np.argwhere(self.fold_num != k)]
        valid_ind = [v[0] for v in np.argwhere(self.fold_num == k)]
        self.train_x = self.x[:, train_ind]
        self.train_y = self.y[:, train_ind]
        self.valid_x = self.x[:, valid_ind]
        self.valid_y = self.y[:, valid_ind]

    def gradient_descent(self, g, x, y, alpha_choice, max_its, batch_size):
        w = self.w_0
        # flatten the input function, create gradient based on flat function
        g_flat, unflatten, w = flatten_func(g, w)
        grad = value_and_grad(g_flat)
        num_train = y.size
        w_hist = [unflatten(w)]
        train_hist = [g_flat(w, x, y, np.arange(num_train))]
        num_batches = int(np.ceil(np.divide(num_train, batch_size)))
        alpha = 0

        for k in range(max_its):
            if alpha_choice == 'diminishing':
                alpha = 1 / float(k + 1)
            else:
                alpha = alpha_choice
            for b in range(num_batches):
                batch_inds = np.arange(b * batch_size, min((b + 1) * batch_size, num_train))
                cost_eval, grad_eval = grad(w, x, y, batch_inds)
                grad_eval.shape = np.shape(w)
                w = w - alpha * grad_eval

            train_cost = g_flat(w, x, y, np.arange(num_train))
            w_hist.append(unflatten(w))
            train_hist.append(train_cost)
        return w_hist, train_hist

    def softmax(self, w, x, y, iter):
        x_p = x[:, iter]
        y_p = y[:, iter]
        cost = np.sum(np.log(1 + np.exp(-y_p * (self.linear_model(x_p, w)))))
        cost += (self.lam * np.sum(np.abs(w[1:])))
        return cost / float(np.size(y_p))

    def counting_mis_classification(self, w, x, y):
        y_predict = np.sign(self.linear_model(x, w))
        num_misclass = len(np.argwhere(y != y_predict))
        return num_misclass

    def train(self, lams, max_its, study_rate):
        all_train_counts = []
        all_valid_counts = []
        for k in range(self.K_fold):
            print("---------fold" + str(k + 1) + "---------")
            print("---------*****---------")
            # self.data_normalization(self.x)
            self.choose_normalizer(name='standard')
            self.make_train_test_split(k)
            self.find_best_reg(lams, max_its, study_rate)
            all_train_counts.append(copy.deepcopy(self.train_count_misclass))
            all_valid_counts.append(copy.deepcopy(self.valid_count_misclass))
        print("finish")
        best_lam = self.count_mis_class_total(all_train_counts, all_valid_counts)
        return best_lam

    def single_trail(self, lams, max_its, study_rate):
        self.data_normalization(self.x)
        train_inds = np.argwhere(self.fold_num != -1)
        train_inds = [v[0] for v in train_inds]
        valid_inds = np.argwhere(self.fold_num == -1)
        valid_inds = [v[0] for v in valid_inds]
        self.valid_x = self.x[:, valid_inds]
        self.valid_y = self.y[:, valid_inds]
        self.train_x = self.x[:, train_inds]
        self.train_y = self.y[:, train_inds]
        self.find_best_reg(lams, max_its, study_rate)

    def find_best_reg(self, lams, max_its, study_rate):
        self.train_count_misclass = []
        self.valid_count_misclass = []
        self.weights = []
        batch_size = np.size(self.train_y)
        self.decent_ini()
        for i in range(len(lams)):
            print('running ' + str(i + 1) + ' of ' + str(len(lams)) + ' rounds')
            self.lam = lams[i]
            weight_history, cost_history = self.gradient_descent(self.softmax, self.train_x,
                                                                 self.train_y, alpha_choice=study_rate,
                                                                 max_its=max_its, batch_size=batch_size)
            w_p = weight_history[np.argmin(cost_history)]
            self.weights.append(w_p)
            self.train_count_misclass.append(self.counting_mis_classification(w_p, self.train_x, self.train_y))
            self.valid_count_misclass.append(self.counting_mis_classification(w_p, self.valid_x, self.valid_y))
        bset_ind = np.argmin(self.valid_count_misclass)
        self.best_lam = lams[bset_ind]
        self.best_weights = self.weights[bset_ind]

    @staticmethod
    def count_mis_class_total(all_train_counts, all_valid_counts):
        all_train_counts = np.array(all_train_counts)
        train_totals = np.sum(all_train_counts, 0)
        all_valid_counts = np.array(all_valid_counts)
        valid_totals = np.sum(all_valid_counts, 0)
        best_valid_ind = np.where(valid_totals == valid_totals.min())[0][-1]
        best_lam = lamda[best_valid_ind]
        return best_lam


if __name__ == "__main__":
    k_fold = 10
    lamda = np.linspace(0, 20, 50)
    file_path = '../mlrefined_datasets/nonlinear_superlearn_datasets/new_gene_data.csv'
    diabetes = Diabetes_Classification(file_path=file_path, K_fold=k_fold)
    lamda_chose = diabetes.train(lamda, max_its=100, study_rate='diminishing')
    print("best lambda is:" + str(lamda_chose))
    clear_output()
    diabetes2 = Diabetes_Classification(file_path=file_path, K_fold=k_fold)
    diabetes2.single_trail(lams=np.array([lamda_chose]), max_its=200, study_rate='diminishing')
    plt.plot(np.abs(diabetes2.best_weights[1:]))
    plt.show()
