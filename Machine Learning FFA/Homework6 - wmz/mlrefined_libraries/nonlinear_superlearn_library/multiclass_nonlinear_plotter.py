import matplotlib.pyplot as plt
import autograd.numpy as np                 # Thinly-wrapped numpy
from mpl_toolkits.mplot3d import Axes3D
import copy

class Plotter:
    def __init__(self,x,y,**kwargs):
        self.x = x
        self.y = y
        self.model = model

    # toy plot
    def toy_plot(self,**kwargs):
        # grab args
        zplane = 'off'
        if 'zplane' in kwargs:
            zplane = kwargs['zplane']
            
        input_view = [20,-70]
        if 'input_view' in kwargs:
            input_view = kwargs['input_view']
        
        # colors for plot 
        color_opts = np.array([[1,0,0.4], [ 0, 0.4, 1],[0, 1, 0.5],[1, 0.7, 0.5],[0.7, 0.6, 0.5]])

        # a 3d plot of data with predictor
        if switch == 2:
            ### plot all input data ###
            # generate input range for functions
            minx = min(min(self.x[:,0]),min(self.x[:,1]))
            maxx = max(max(self.x[:,0]),max(self.x[:,1]))
            gapx = (maxx - minx)*0.1
            minx -= gapx
            maxx += gapx
   
            r = np.linspace(minx,maxx,200)
            w1_vals,w2_vals = np.meshgrid(r,r)
            w1_vals.shape = (len(r)**2,1)
            w2_vals.shape = (len(r)**2,1)
            h = np.concatenate([w1_vals,w2_vals],axis = 1)
            g_vals = self.model.predict(h)
            g_vals = np.asarray(g_vals)

            # vals for cost surface
            w1_vals.shape = (len(r),len(r))
            w2_vals.shape = (len(r),len(r))
            g_vals.shape = (len(r),len(r))

            # create figure to plot
            fig = plt.figure(num=None, figsize=(12,5), dpi=80, facecolor='w', edgecolor='k')
            
            ### create 3d plot in left panel
            ax1 = plt.subplot(121,projection = '3d')
            ax2 = plt.subplot(122)

            fig.subplots_adjust(left=0,right=1,bottom=0,top=1)   # remove whitespace around 3d figure
            
            # scatter points in both panels
            class_nums = np.unique(self.y)
            C = len(class_nums)
            for c in range(C):
                ind = np.argwhere(self.y == class_nums[c])
                ind = [v[0] for v in ind]
                ax1.scatter(self.x[ind,0],self.x[ind,1],self.y[ind],s = 80,color = color_opts[c],edgecolor = 'k',linewidth = 1.5)
                ax2.scatter(self.x[ind,0],self.x[ind,1],s = 110,color = color_opts[c],edgecolor = 'k', linewidth = 2)
            
            # switch for 2class / multiclass view
            if C == 2:
                # plot regression surface
                ax1.plot_surface(w1_vals,w2_vals,g_vals,alpha = 0.1,color = 'k',rstride=20, cstride=20,linewidth=0,edgecolor = 'k') 

                # plot zplane = 0 in left 3d panel - showing intersection of regressor with z = 0 (i.e., its contour, the separator, in the 3d plot too)?
                if zplane == 'on':
                    ax1.plot_surface(w1_vals,w2_vals,g_vals*0,alpha = 0.1,rstride=20, cstride=20,linewidth=0.15,color = 'k',edgecolor = 'k') 
            
                    # plot separator in left plot z plane
                    ax1.contour(w1_vals,w2_vals,g_vals,colors = 'k',levels = [0],linewidths = 3,zorder = 1)
                    
                    # color parts of plane with correct colors
                    ax1.contourf(w1_vals,w2_vals,g_vals+1,colors = color_opts[:],alpha = 0.1,levels = range(0,2))
                    ax1.contourf(w1_vals,w2_vals,-g_vals+1,colors = color_opts[1:],alpha = 0.1,levels = range(0,2))
    
                # plot separator in right plot
                ax2.contour(w1_vals,w2_vals,g_vals,colors = 'k',levels = [0],linewidths = 3,zorder = 1)
            
                # adjust height of regressor to plot filled contours
                ax2.contourf(w1_vals,w2_vals,g_vals+1,colors = color_opts[:],alpha = 0.1,levels = range(0,C+1))

                ### clean up panels
                # set viewing limits on vertical dimension for 3d plot           
                minz = min(copy.deepcopy(self.y))
                maxz = max(copy.deepcopy(self.y))

                gapz = (maxz - minz)*0.1
                minz -= gapz
                maxz += gapz

                ax1.set_zlim([minz,maxz])
                ax1.view_init(input_view[0],input_view[1])   
                ax2.axis('off')
            
            # multiclass view
            else:   
                # plot regression surface
                ax1.plot_surface(w1_vals,w2_vals,g_vals,alpha = 0.1,color = 'k',rstride=20, cstride=20,linewidth=0,edgecolor = 'k') 
            
                # plot zplane = 0 in left 3d panel - showing intersection of regressor with z = 0 (i.e., its contour, the separator, in the 3d plot too)?
                if zplane == 'on':
                    ax1.plot_surface(w1_vals,w2_vals,g_vals*0,alpha = 0.1,rstride=20, cstride=20,linewidth=0.15,color = 'k',edgecolor = 'k') 
                    
                    for c in class_nums:
                        # plot separator curve in left plot z plane
                        ax1.contour(w1_vals,w2_vals,g_vals - c,colors = 'k',levels = [0],linewidths = 3,zorder = 1)
                        
                        # color parts of plane with correct colors
                        ax1.contourf(w1_vals,w2_vals, g_vals - 0.5 - c + 1 ,colors = color_opts[(int(c)-1):],alpha = 0.1,levels = range(0,2))
             
                
                # plot separator in right plot
                ax2.contour(w1_vals,w2_vals,g_vals,colors = 'k',levels = range(0,C+1),linewidths = 3,zorder = 1)
            
                # adjust height of regressor to plot filled contours
                ax2.contourf(w1_vals,w2_vals,g_vals,colors = color_opts[:],alpha = 0.1,levels = range(0,C+1))

                ### clean up panels
                # set viewing limits on vertical dimension for 3d plot 
                minz = 0
                maxz = max(copy.deepcopy(self.y))
                gapz = (maxz - minz)*0.1
                minz -= gapz
                maxz += gapz
                ax1.set_zlim([minz,maxz])
                
                ax1.view_init(input_view[0],input_view[1]) 
                ax2.axis('off')

            plt.show()