require('../db/model/users.model.js')
require('../db/model/goods.model.js')
const Mongoose = require('mongoose');
const modelUser = Mongoose.model('user');
const base = require('../util/base.js')
const modelProduct = Mongoose.model('product')
// const Promise = require('promise'); // 配合 Mongoose 使用

// 判断是否存在
let hasUserInfo = async (param) => {
  return modelUser.findOne(param)
    .then(data => {
      if(data) {
        return data
      } else {
        return false
      }
    })
    .catch(err => {
      console.log('hasUserInfo', err)
    })
}

/**
 * @method userCookie
 * @description 判断 cookies 是否存在 user 信息
 * 存在 => @return user
 * 不存在 => @return false
 */
let userCookie = async ({req, res}) => {
  let _user = req.cookies ? req.cookies.user : ''
  let user = JSON.parse(_user)
  if(!base.isObject(user)) {
    res.cookie('user', '', {
      path:"/",
      maxAge:-1
    })
    res.json({
      response: {
        error_code: 10005,
        error_message: '',
        hint_message: '未登录，请先登录',
      }
    })
    return false
  } else {
    return user
  }
}

// 登录请求
let login = async (req, res, next) => {
  let { userName, userPwd } = req.body
  if(!userName) {
    res.json({
      response: {
        error_code: 10001,
        error_message: '',
        hint_message: '用户名不能为空',
      }
    })
  }
  if(!userPwd) {
    res.json({
      response: {
        error_code: 10002,
        error_message: '',
        hint_message: '密码不能为空',
      }
    })
  }
  let reqParam = {
    userName,
    userPwd
  }
  
  let _hasUserInfo = await hasUserInfo(reqParam) // 查询是否有登录信息
  if(_hasUserInfo) { // 输出
    let { userName, userId } = _hasUserInfo
    // 写入 cookie
    res.cookie("user", JSON.stringify({ userName, userId }), {
      path: '/',
      maxAge: 1000 * 3600
    })
    res.json({
      response: {
        error_code: 0,
        error_message: '',
        hint_message: '',
      },
      data: { userName, userId }
    })
  } else {
    res.json({
      response: {
        error_code: 10003,
        error_message: '',
        hint_message: '用户尚未注册',
      }
    })
  }
}

// 注册
let register = async (req, res, next) => {
  let { userName, userPwd } = req.body
  if(!userName) {
    res.json({
      response: {
        error_code: 10001,
        error_message: '',
        hint_message: '用户名不能为空',
      }
    })
  }
  if(!userPwd) {
    res.json({
      response: {
        error_code: 10002,
        error_message: '',
        hint_message: '密码不能为空',
      }
    })
  }
  let reqParam = {
    userName,
    userPwd
  }
  let _hasUserInfo = await hasUserInfo(reqParam) // 查询是否有登录信息

  if(_hasUserInfo) {
    res.json({
      response: {
        error_code: 10004,
        error_message: '',
        hint_message: '您已注册，请登录',
      }
    })
  } else {
    let user = new modelUser(reqParam)
    user.save()
      .then(data => {
        let { userName, userId } = data
        // 写入 cookie
        res.cookie("user", JSON.stringify({ userName, userId }), {
          path: '/',
          maxAge: 1000 * 3600
        })
        res.json({
          response: {
            error_code: 0,
            error_message: '',
            hint_message: '',
          }
        })
      })
      .catch(err => {
        res.json({
          response: {
            error_code: 10005,
            error_message: err,
            hint_message: '注册失败',
          }
        })
      })
  }
}

// 登出
let loginOut = async (req, res, next) => {
  res.cookie('user', '', {
    path:"/",
    maxAge:-1
  })
}

// 获取用户购物车数据
let cartList = async (req, res, next) => {
  console.log('cartList req.body', req.body)
  console.log('cartList req.cookies', req.cookies)
  
  let user = await userCookie({req, res})
  console.log('userCookie user', user)
  if(!user) {
    return false
  }

  let { pageSize, page } = req.body
  let userid = user.userId
  let _pageSize = parseInt(pageSize)
  let _page = parseInt(page)
  let _userid = String(userid)

  let skip = _pageSize * (_page - 1)
  if(isNaN(_pageSize)) {
    res.json({
      response: {
        error_code: 10001,
        error_message: '',
        hint_message: 'pageSize 是必传的',
      }
    })
  }
  if(isNaN(_page)) {
    res.json({
      response: {
        error_code: 10002,
        error_message: '',
        hint_message: 'page 是必传的',
      }
    })
  }
  if(isNaN(_userid)) {
    res.json({
      response: {
        error_code: 10003,
        error_message: '',
        hint_message: 'userid 是必传的',
      }
    })
  }

  let params = {
    userId: _userid
  }
  return modelUser.find(params)
    .then(data => {
      if(data && data.length === 0){
        res.json({
          response: {
            error_code: 10004,
            error_message: '',
            hint_message: '暂无数据',
          }
        })
      } else {
        let totalNum = 0
        let { cartList } = data[0]
        totalNum = cartList.length
        let newCartList = cartList.slice(skip, _pageSize * page)
        let info = {
          totalNum,
          data: newCartList
        }
        res.json({
          response: {
            error_code: 0,
            error_message: '',
            hint_message: '',
          },
          info
        })
      }
    })
    .catch(err => {
      console.log(err)
    })
}

// 删除购物车数据
let cartDel = async (req, res ,next) => {
  let user = await userCookie({req, res})
  console.log('userCookie user', user)
  if(!user) {
    return false
  }
  let { productId, userId } = req.body
  let _productId = String(productId)
  let _userId = String(userId)

  let result = await modelUser.update({"userId": _userId}, {$pull:{
    'cartList':{
      'productId':_productId
    }
  }})
  console.log('cartDel result', result)
  if(result) {
    res.json({
      response: {
        error_code: 0,
        error_message: '',
        hint_message: '删除成功',
      }
    })
  } else {
    res.json({
      response: {
        error_code: 10001,
        error_message: '',
        hint_message: '删除失败',
      }
    })
  }
}

// 添加商品到购物车
let cartAdd = async (req, res, next) => {
  let user = await userCookie({req, res})
  console.log('userCookie user', user)
  if(!user) {
    return false
  }
  let { productId, userId } = req.body

  let _productId = String(productId)
  let _userId = String(userId)
  if(!_productId) {
    res.json({
      response: {
        error_code: 10001,
        error_message: '',
        hint_message: '产品ID 是必传的',
      }
    })
  }
  if(!_userId) {
    res.json({
      response: {
        error_code: 10002,
        error_message: '',
        hint_message: '用户ID 是必传的',
      }
    })
  }
  // 查询用户数据
  let userInfo = await modelUser.findOne({userId: _userId})
  
  console.log('userInfo', userInfo)
  if(!userInfo) {
    res.json({
      response: {
        error_code: 10003,
        error_message: userInfo,
        hint_message: '',
      }
    })
    return false
  } else {
    let cartList = userInfo.cartList
    if(Array.isArray(cartList) && cartList.length > 0) {
      let existGoods = cartList.find(item => {
        return item.productId === _productId
      })
      if(existGoods) { // 存在，则直接 += 1
        existGoods.productNum = Number(existGoods.productNum) + 1
      } else { // 不存在，新增一条数据
        let product = await modelProduct.findOne({"productId": String(_productId)})
        console.log('product 1', Object.keys(product))
        product.productNum = 1
        userInfo.cartList.push(product)
      }
    } else { // 数组不存在，直接添加一组新数据
      let product = await modelProduct.findOne({"productId": String(_productId)})
      console.log('product 2', typeof product)
      product.productNum = 1
      let arr = []
      arr.push(product)
      userInfo.cartList = arr
    }
  }
  userInfo.save()
    .then(doc => {
      res.json({
        response: {
          error_code: 0,
          error_message: '',
          hint_message: '添加成功',
        }
      })
    })
    .catch(err => {
      res.json({
        response: {
          error_code: 10001,
          error_message: '',
          hint_message: err,
        }
      })
    })
}

// 购物车确认
let cartConfirm = async (req, res, next) => {
  let user = await userCookie({req, res})
  if(!user) {
    return false
  }
  let { productIds } = req.body
  let { userId } = user

  if(!(Array.isArray(productIds) || productIds.length > 0)) {
    res.json({
      response: {
        error_code: 10001,
        error_message: '',
        hint_message: '商品不能为空',
      }
    })
    return false
  }

  let userInfo = await modelUser.findOne({"userId": userId})
  if(userInfo) {
    let cartList = userInfo.cartList || []
    if(Array.isArray(cartList) && cartList.length > 0) {
      cartList.forEach(item => item.checked = 0)
      productIds.forEach(id => {
        let existItem = cartList.find(item => item.productId === id)
        existItem.checked = 1
      })
    }
    let saveRel = await userInfo.save()
    if(saveRel) {
      res.json({
        response: {
          error_code: 0,
          error_message: '',
          hint_message: '保存成功',
        }
      })
    } else {
      res.json({
        response: {
          error_code: 10005,
          error_message: '',
          hint_message: '保存失败',
        }
      })
    }
  } else {
    res.json({
      response: {
        error_code: 10002,
        error_message: '',
        hint_message: '用户暂无信息',
      }
    })
  }
}

// 用户地址列表
let address = async (req, res, next) => {
  let user = await userCookie({req, res})
  if(!user) {
    return false
  }
  let userid = user.userId
  let reqParam = {
    userId: String(userid)
  }
  modelUser.findOne(reqParam)
    .then(data => {
      if(data && data.length === 0){
        res.json({
          response: {
            error_code: 10004,
            error_message: '',
            hint_message: '暂无数据',
          }
        })
      } else {
        res.json({
          response: {
            error_code: 0,
            error_message: '',
            hint_message: '暂无数据',
          },
          data: data.addressList
        })
      }
    })
    .catch(err => {
      res.json({
        response: {
          error_code: 10005,
          error_message: err,
          hint_message: '',
        }
      })
    })
}

// 设置用户默认地址
let setAddress = async (req, res, next) => {
  let user = await userCookie({req, res})
  if(!user) {
    return false
  }
  let { addressId } = req.body
  let { userId } = user

  if(!addressId) {
    res.json({
      response: {
        error_code: 10001,
        error_message: '',
        hint_message: '地址不能为空',
      }
    })
    return false
  }

  let userInfo = await modelUser.findOne({'userId': userId})
  if(userInfo) {
    let addressList = userInfo.addressList
    addressList.forEach(item => {
      if(Number(item.addressId) === Number(addressId)) {
        item.isDefault = true
      } else {
        item.isDefault = false
      }
    })
    let saveRel = await userInfo.save()
    if(saveRel) {
      res.json({
        response: {
          error_code: 0,
          error_message: '',
          hint_message: '保存成功',
        }
      })
    } else {
      res.json({
        response: {
          error_code: 10005,
          error_message: '',
          hint_message: '保存失败',
        }
      })
    }
  } else {
    res.json({
      response: {
        error_code: 10002,
        error_message: '',
        hint_message: '用户暂无数据',
      }
    })
  }
  
}

// 删除用户地址
let delAddress = async (req, res, next) => {
  let user = await userCookie({req, res})
  if(!user) {
    return false
  }
  let { addressId } = req.body
  let { userId } = user

  if(!addressId) {
    res.json({
      response: {
        error_code: 10001,
        error_message: '',
        hint_message: '地址不能为空',
      }
    })
    return false
  }

  let result = await modelUser.update({'userId': userId}, {
    $pull: {
      'addressList': {
        'addressId': String(addressId)
      }
    }
  })
  console.log('delAddress result', result)
  if(result) {
    res.json({
      response: {
        error_code: 0,
        error_message: '',
        hint_message: '删除成功',
      }
    })
  } else {
    res.json({
      response: {
        error_code: 10001,
        error_message: '',
        hint_message: '删除失败',
      }
    })
  }
}

// 订单列表
let getOrderList = async (req, res, next) => {
  console.log('calculate', 0.1 + 0.2)
  let user = await hasUserInfo({req, res})
  if(!user) {
    return false
  }
  let { userId } = user
  let userInfo = await modelUser.findOne({userId})
  if(userInfo) {
    let cartList = userInfo.cartList
    if(Array.isArray(cartList) && cartList.length > 0) {
      let orderList = cartList.filter(item => {
        return item.checked === 1
      })
      res.json({
        response: {
          error_code: 0,
          error_message: '',
          hint_message: '',
          data: orderList
        }
      })
    } else {
      res.json({
        response: {
          error_code: 10002,
          error_message: '',
          hint_message: '暂无订单数据',
        }
      })
    }
  } else {
    res.json({
      response: {
        error_code: 10001,
        error_message: '',
        hint_message: '暂无用户信息',
      }
    })
  }
}

// 确认订单
let addOrderList = async (req, res, next) => {
  let user = await hasUserInfo({req, res})
  if(!user) {
    return false
  }
  let { userId } = user

  let userInfo = await modelUser.findOne({ userId })
  if(userInfo) {
    // 构造
    let platform = '622'
    let r1 = Math.floor(Math.random() * 10)
    let r2 = Math.floor(Math.random() * 10)

    let sysDate = new Date().Format('yyyyMMddhhmmss')
    let createDate = new Date().Format('yyyy-MM-dd hh:mm:ss')

    let orderId = platform + r1 + sysDate + r2 // 订单ID

    let cartList = userInfo.cartList // 购物车数据
    
    let goodsList = cartList.filter(item => { // 订单数据
      return item.checked === 1
    })

    let orderTotal = goodsList.reduce((total, item) => { // 订单总价
      return total + Number(item.productNum) * Number(item.salePrice)
    }, 0)

    let address = userInfo.addressList.find(addr => {
      return addr.isDefault
    })


    let order = {
      orderId: orderId,
      orderTotal: orderTotal,
      addressInfo: address,
      goodsList: goodsList,
      orderStatus:'1',
      createDate: createDate
    };

    if(Array.isArray(userInfo.orderList)) {
      userInfo.orderList.push(order)
    } else {
      userInfo.orderList = [].push(order)
    }
  } else {
    res.json({
      response: {
        error_code: 10001,
        error_message: '',
        hint_message: '暂无用户数据',
      }
    })
  }
}

module.exports = {
  login,
  register,
  cartList,
  cartAdd,
  cartDel,
  cartConfirm,
  address,
  setAddress,
  delAddress,
  getOrderList,
  addOrderList
}
