import sys
from mlrefined_libraries.nonlinear_superlearn_library.recursive_tree_lib.ClassificationTree import ClassificationStump
from mlrefined_libraries.nonlinear_superlearn_library.recursive_tree_lib.classification_animator import Visualizer

sys.path.append('../')
datapath = '../mlrefined_datasets/nonlinear_superlearn_datasets/'

# import custom libraries
from mlrefined_libraries import nonlinear_superlearn_library as nonlib

# this is needed to compensate for %matplotlib notebook's tendancy to blow up images when plotted inline
from matplotlib import rcParams

rcParams['figure.autolayout'] = True

csvname = datapath + '3_layercake_data.csv'

# learn classification tree for input dataset
depth = 7
tree = nonlib.recursive_tree_lib.ClassificationTree.RTree(csvname, depth)

# animate growth
demo = nonlib.recursive_tree_lib.classification_animator.Visualizer(csvname)
demo.animate_trees(tree, pt_size=20)
