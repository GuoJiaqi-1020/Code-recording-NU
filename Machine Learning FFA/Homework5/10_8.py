from mlrefined_libraries.nonlinear_superlearn_library import nonlinear_classification_visualizer as ncv
from mlrefined_libraries.nonlinear_superlearn_library import basic_runner
import autograd.numpy as np

Visualizer = ncv.Visualizer


class Engineering_Feature_Transformation(Visualizer):
    def __init__(self, file_path):
        super().__init__(file_path)
        self.decent_initializer(2)

    def decent_initializer(self, scale):
        self.w0 = [scale * np.random.randn(3, 1), scale * np.random.randn(2, 1)]

    @staticmethod
    def feature_transforms(x, w):
        f = np.sin(w[0] + np.dot(x.T, w[1:])).T
        return f

    def train(self, loss_fun, study_rate, iters, normalize):
        model = basic_runner.Setup(self.x.T, self.y, self.feature_transforms, loss_fun, normalize=normalize)
        model.fit(w=self.w0, alpha_choice=study_rate, max_its=iters)
        ind = np.argmin(model.cost_history)
        self.w_best = model.weight_history[ind]
        self.model = model

    def visulizer(self):
        self.static_N2_simple(self.w_best, self.model, view=[30, 160])


if __name__ == "__main__":
    file_path = '../mlrefined_datasets/nonlinear_superlearn_datasets/diagonal_stripes.csv'
    Eng_trans = Engineering_Feature_Transformation(file_path)
    Eng_trans.plot_data()
    Eng_trans.train(loss_fun='softmax', study_rate=0.1, iters=2000)
    Eng_trans.visulizer()
