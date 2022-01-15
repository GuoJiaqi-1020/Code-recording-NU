 # import autograd functionality to bulid function's properly for optimizers
import autograd.numpy as np
import math
import copy

# import matplotlib functionality
import matplotlib.pyplot as plt
from matplotlib import gridspec
        
def show_encode_decode(x,wrapper,**kwargs):
    # strip instruments off autoencoder wrapper
    cost_history = wrapper.cost_history
    weight_history = wrapper.weight_history
    encoder = wrapper.encoder
    decoder = wrapper.decoder
    normalizer = wrapper.normalizer
    inverse_normalizer = wrapper.inverse_normalizer
    
    # show projection map or not
    projmap = False
    if 'projmap' in kwargs:
        projmap = kwargs['projmap']

    # for projection map drawing - arrow size
    scale = 14
    if 'scale' in kwargs:
        scale = kwargs['scale']

    # pluck out best weights from run
    ind = np.argmin(cost_history)
    w_best = weight_history[ind]

    ###### figure 1 - original data, encoded data, decoded data ######
    fig = plt.figure(figsize = (10,3))
    gs = gridspec.GridSpec(1, 3) 
    ax1 = plt.subplot(gs[0],aspect = 'equal'); 
    ax2 = plt.subplot(gs[1],aspect = 'equal'); 
    ax3 = plt.subplot(gs[2],aspect = 'equal'); 

    # scatter original data with pc
    ax1.scatter(x[0,:],x[1,:],c = 'k',s = 60,linewidth = 0.75,edgecolor = 'w')

    ### plot encoded and decoded data ###
    # create encoded vectors
    v = encoder(normalizer(x),w_best[0])

    # decode onto basis
    p = inverse_normalizer(decoder(v,w_best[1]))

    # plot decoded data 
    ax3.scatter(p[0,:],p[1,:],c = 'k',s = 60,linewidth = 0.75,edgecolor = 'r')

    # define range for manifold
    xmin1 = np.min(x[0,:])
    xmax1 = np.max(x[0,:])
    xmin2 = np.min(x[1,:])
    xmax2 = np.max(x[1,:])
    xgap1 = (xmax1 - xmin1)*0.2
    xgap2 = (xmax2 - xmin2)*0.2
    xmin1 -= xgap1
    xmax1 += xgap1
    xmin2 -= xgap2
    xmax2 += xgap2
    
    # plot learned manifold
    a = np.linspace(xmin1,xmax1,200)
    b = np.linspace(xmin2,xmax2,200)
    s,t = np.meshgrid(a,b)
    s.shape = (1,len(a)**2)
    t.shape = (1,len(b)**2)
    z = np.vstack((s,t))
    
    # create encoded vectors
    v = encoder(normalizer(z),w_best[0])

    # decode onto basis
    p = inverse_normalizer(decoder(v,w_best[1]))
    
    # scatter
    ax2.scatter(p[0,:],p[1,:],c = 'k',s = 1.5,edgecolor = 'r',linewidth = 1,zorder = 0)
    ax3.scatter(p[0,:],p[1,:],c = 'k',s = 1.5,edgecolor = 'r',linewidth = 1,zorder = 0)
         
    for ax in [ax1,ax2,ax3]:
        ax.set_xlim([xmin1,xmax1])
        ax.set_ylim([xmin2,xmax2])
        ax.set_xlabel(r'$x_1$',fontsize = 16)
        ax.set_ylabel(r'$x_2$',fontsize = 16,rotation = 0,labelpad = 10)
        ax.axvline(linewidth=0.5, color='k',zorder = 0)
        ax.axhline(linewidth=0.5, color='k',zorder = 0)

    ax1.set_title('original data',fontsize = 18)
    ax2.set_title('learned manifold',fontsize = 18)
    ax3.set_title('decoded data',fontsize = 18)

    # set whitespace
    #fgs.update(wspace=0.01, hspace=0.5) # set the spacing between axes. 
        
    ##### bottom panels - plot subspace and quiver plot of projections ####
    if projmap == True:
        fig = plt.figure(figsize = (10,4))
        gs = gridspec.GridSpec(1, 1) 
        ax1 = plt.subplot(gs[0],aspect = 'equal'); 
        ax1.scatter(p[0,:],p[1,:],c = 'r',s = 9.5)
        ax1.scatter(p[0,:],p[1,:],c = 'k',s = 1.5)
        
        ### create quiver plot of how data is projected ###
        new_scale = 0.75
        a = np.linspace(xmin1 - xgap1*new_scale,xmax1 + xgap1*new_scale,20)
        b = np.linspace(xmin2 - xgap2*new_scale,xmax2 + xgap2*new_scale,20)
        s,t = np.meshgrid(a,b)
        s.shape = (1,len(a)**2)
        t.shape = (1,len(b)**2)
        z = np.vstack((s,t))
        
        v = 0
        p = 0
        # create encoded vectors
        v = encoder(normalizer(z),w_best[0])

        # decode onto basis
        p = inverse_normalizer(decoder(v,w_best[1]))

        # get directions
        d = []
        for i in range(p.shape[1]):
            dr = (p[:,i] - z[:,i])[:,np.newaxis]
            d.append(dr)
        d = 2*np.array(d)
        d = d[:,:,0].T
        M = np.hypot(d[0,:], d[1,:])
        ax1.quiver(z[0,:], z[1,:], d[0,:], d[1,:],M,alpha = 0.5,width = 0.01,scale = scale,cmap='autumn') 
        ax1.quiver(z[0,:], z[1,:], d[0,:], d[1,:],edgecolor = 'k',linewidth = 0.25,facecolor = 'None',width = 0.01,scale = scale) 

        #### clean up and label panels ####
        for ax in [ax1]:
            #ax.set_xlim([xmin1 - xgap1*new_scale,xmax1 + xgap1*new_scale])
            #ax.set_ylim([xmin2 - xgap2*new_scale,xmax2 + xgap1*new_scale])
            
            ax.set_xlim([xmin1,xmax1])
            ax.set_ylim([xmin2,xmax2])
            
            ax.set_xlabel(r'$x_1$',fontsize = 16)
            ax.set_ylabel(r'$x_2$',fontsize = 16,rotation = 0,labelpad = 10)

        ax1.set_title('projection map',fontsize = 18)

        # set whitespace
        gs.update(wspace=0.01, hspace=0.5) # set the spacing between axes. 
    
# draw a vector
def vector_draw(vec,ax,**kwargs):
    color = 'k'
    if 'color' in kwargs:
        color = kwargs['color']
    zorder = 3 
    if 'zorder' in kwargs:
        zorder = kwargs['zorder']
        
    veclen = math.sqrt(vec[0]**2 + vec[1]**2)
    head_length = 0.25
    head_width = 0.25
    vec_orig = copy.deepcopy(vec)
    vec = (veclen - head_length)/veclen*vec
    ax.arrow(0, 0, vec[0],vec[1], head_width=head_width, head_length=head_length, fc=color, ec=color,linewidth=3,zorder = zorder)
      