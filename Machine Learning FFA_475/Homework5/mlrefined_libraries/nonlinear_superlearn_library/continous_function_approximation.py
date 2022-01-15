# imports from custom library
from .library_v1 import superlearn_setup
from . import run_animators

def run():
    #from library_v1 import superlearn_setup
    datapath = '../../mlrefined_datasets/nonlinear_superlearn_datasets/'

    # import autograd functionality
    import autograd.numpy as np

    #### create instance of learner and tune to dataset ####
    csvname = datapath + 'universal_regression_function.csv'
    data = np.loadtxt(csvname,delimiter = ',')
    x = data[:-1,:]
    y = data[-1:,:] 

    # import the v1 library
    mylib = superlearn_setup.Setup(x,y)

    # choose features
    mylib.choose_features(name = 'multilayer_perceptron',layer_sizes = [1,100,1],activation = 'tanh')

    # choose normalizer
    mylib.choose_normalizer(name = 'standard')

    # choose cost
    mylib.choose_cost(name = 'least_squares')

    # fit an optimization
    mylib.fit(max_its = 1000,alpha_choice = 10**(-2))

    #### load in animator and roll ####
    # load up animator
    demo = run_animators.Visualizer(csvname)

    # pluck out a sample of the weight history
    num_frames = 10 # how many evenly spaced weights from the history to animate

    # animate based on the sample weight history
    demo.animate_1d_regression(mylib,num_frames,scatter = 'none',show_history = True)
    plt.show()