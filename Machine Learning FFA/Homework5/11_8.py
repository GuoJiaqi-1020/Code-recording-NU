import copy
import autograd.numpy as np
from mlrefined_libraries.nonlinear_superlearn_library.multiclass_bagging_visualizers import Visualizer
from mlrefined_libraries.nonlinear_superlearn_library.reg_lib.super_setup import Setup


class multi_class_ml_function(Visualizer):
    def __init__(self, file_path):
        data = np.loadtxt(file_path, delimiter=',')
        Visualizer.__init__(self, file_path)
        self.x = data[:-1, :]
        self.y = data[-1:, :]
        self.visulizer = Visualizer(file_path)

    def make_train_val_split(self, train_portion):
        self.train_portion = train_portion
        r = np.random.permutation(self.x.shape[1])
        train_num = int(np.round(train_portion * len(r)))
        self.train_inds = r[:train_num]
        self.valid_inds = r[train_num:]

        self.x_train = self.x[:, self.train_inds]
        self.x_valid = self.x[:, self.valid_inds]

        self.y_train = self.y[:, self.train_inds]
        self.y_valid = self.y[:, self.valid_inds]

    def train(self, num_bag, train_portion, degree):
        model = []
        for j in range(num_bag):
            setup = Setup(self.x, self.y)
            setup.preprocessing_steps(name="standard")
            setup.make_train_val_split(train_portion)
            for d in range(1, degree + 1):
                setup.choose_cost(name='multiclass_softmax')
                setup.choose_features(name='polys', degree=d, num_classifiers=4)
                setup.fit(algo='newtons_method', max_its=5, verbose=False, lam=10 ** (-6))

            # keep only the best degree, based on lowest validation cost
            val_costs = [np.min(setup.valid_count_histories[i]) for i in range(degree)]
            min_ind = np.argmin(val_costs)
            # min_val = val_costs[min_ind]

            # get minor of minor
            smallest_ind = np.argmin(setup.valid_count_histories[min_ind])
            setup.train_cost_histories = setup.train_cost_histories[min_ind][smallest_ind]
            setup.valid_cost_histories = setup.valid_cost_histories[min_ind][smallest_ind]
            setup.train_count_histories = setup.train_count_histories[min_ind][smallest_ind]
            setup.valid_count_histories = setup.valid_count_histories[min_ind][smallest_ind]
            setup.weight_histories = setup.weight_histories[min_ind][smallest_ind]
            setup.choose_features(name='polys', degree=min_ind + 1)
            model.append(copy.deepcopy(setup))
        return model


if __name__ == "__main__":
    file_path = '../mlrefined_datasets/nonlinear_superlearn_datasets/3eggs_multiclass.csv'
    bagging8 = multi_class_ml_function(file_path=file_path)
    trained_model = bagging8.train(num_bag=5, train_portion=0.66, degree=5)
    bagging8.show_baggs(trained_model)
