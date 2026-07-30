---
templateId: shared-components.email-templates.example
componentType: markdown-apexlang-example
version: 1.0
migrationNote: preserved from previous standalone template example
---

# Email Templates Example

## Purpose

Markdown-preserved APEXlang example. Use this file for syntax and structure only after loading the family `_index.md` and `_common.md` contract.

## Example

```apexlang
/*
Template Name should not contain special characters. Only the characters a-Z, 0-9 and spaces are allowed.
*/
emailTemplate order-confirmation (
    name: order confirmation
    emailSubject: Order (#ORDER_NUMBER#) Confirmed!
    htmlFormat {
        header: <b style="font-size: 24px;">My Application</b>
        body: 
            ```html
            <strong>Hello #CUSTOMER_NAME#</strong>,<br>
            <br>
            Thank you for placing your order!<br>
            <br>
            <strong>Order Details</strong><br>
            <br>
            <table width="100%">
              <tr>
                <th align="left">Order Date</th>
                <td>#ORDER_DATE#</td>
              </tr>
              <tr>
                <th align="left">Order Number</th>
                <td>#ORDER_NUMBER#</td>
              </tr>
              <tr>
                <th align="left">Ship To</th>
                <td>#SHIP_TO#</td>
              </tr>
              <tr>
                <th align="left" valign="top">Shipping Address</th>
                <td>
                  #SHIPPING_ADDRESS_LINE_1#<br>
                  #SHIPPING_ADDRESS_LINE_2#
                </td>
              </tr>
              <tr>
                <th align="left" valign="top">Items Ordered</th>
                <td>#ITEMS_ORDERED#</td>
              </tr>
              <tr>
                <th align="left">Order Total</th>
                <td>#ORDER_TOTAL#</td>
              </tr>
            </table>
            <br>
            <br>
            Need to make a change to your order? <a href="#ORDER_URL#">Manage your order #ORDER_NUMBER# here.</a>
            ```
        footer: <a rel="noopener noreferrer" href="#MY_APPLICATION_LINK#">Visit My Application and manage your email preferences</a>.
    }
    plainTextFormat {
        content: 
            ```html
            Hello #CUSTOMER_NAME#,
            
            Thank you for placing your order!
            
            Order Details
            --------------------------------------------------------------------------------
              Order Date:       #ORDER_DATE#
              Order Number:     #ORDER_NUMBER#
              Ship To:          #SHIP_TO#
              Shipping Address: #SHIPPING_ADDRESS_LINE_1#
                                #SHIPPING_ADDRESS_LINE_2#
              Items Ordered:    #ITEMS_ORDERED#
              Order Total:      #ORDER_TOTAL#
            --------------------------------------------------------------------------------
            
            Need to make a change to your order? Manage your order #ORDER_NUMBER# here: #ORDER_URL#
            ```
    }
    advanced {
        versionNumber: 2
    }
)
```
