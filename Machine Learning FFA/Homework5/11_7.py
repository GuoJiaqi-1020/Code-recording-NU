import copy
import autograd.numpy as np
from mlrefined_libraries.nonlinear_superlearn_library.classification_bagging_visualizers_v2 import Visualizer
from mlrefined_libraries.nonlinear_superlearn_library.reg_lib.super_setup import Setup


class Bagging_Two_Class_Classification(Visualizer):
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
            model_11_7 = Setup(self.x, self.y)
            model_11_7.preprocessing_steps(name="standard")
            model_11_7.make_train_val_split(train_portion)
            for d in range(1, degree + 1):
                model_11_7.choose_cost(name='softmax')
                model_11_7.choose_features(name='polys', degree=d)
                model_11_7.fit(algo='newtons_method', max_its=10, verbose=False, lam=10 ** (-8))

            # keep only the best degree, based on lowest validation cost
            val_costs = [np.min(model_11_7.valid_count_histories[i]) for i in range(degree)]
            min_ind = np.argmin(val_costs)
            min_val = val_costs[min_ind]

            # get minor of minor
            smallest_ind = np.argmin(model_11_7.valid_count_histories[min_ind])
            model_11_7.train_cost_histories = model_11_7.train_cost_histories[min_ind][smallest_ind]
            model_11_7.valid_cost_histories = model_11_7.valid_cost_histories[min_ind][smallest_ind]
            model_11_7.train_count_histories = model_11_7.train_count_histories[min_ind][smallest_ind]
            model_11_7.valid_count_histories = model_11_7.valid_count_histories[min_ind][smallest_ind]
            model_11_7.weight_histories = model_11_7.weight_histories[min_ind][smallest_ind]
            model_11_7.choose_features(name='polys', degree=min_ind + 1)

            # store
            model.append(copy.deepcopy(model_11_7))
        return model

    def visulization(self, model):
        self.visulizer.show_runs(model)


if __name__ == "__main__":
    file_path = '../mlrefined_datasets/nonlinear_superlearn_datasets/new_circle_data.csv'
    bagging8 = Bagging_Two_Class_Classification(file_path=file_path)
    trained_model = bagging8.train(num_bag=5, train_portion=0.67, degree=8)
    bagging8.show_runs(trained_model)
