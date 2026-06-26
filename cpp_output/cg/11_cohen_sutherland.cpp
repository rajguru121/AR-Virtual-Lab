#include <graphics.h>
#include <conio.h>
#include <iostream>
using namespace std;

// Region codes for Cohen-Sutherland
const int INSIDE = 0; // 0000
const int LEFT   = 1; // 0001
const int RIGHT  = 2; // 0010
const int BOTTOM = 4; // 0100
const int TOP    = 8; // 1000

// Clipping window boundaries
int xmin, ymin, xmax, ymax;

// Compute the region code for a point
int computeCode(int x, int y)
{
    int code = INSIDE;
    if (x < xmin) code |= LEFT;
    else if (x > xmax) code |= RIGHT;
    if (y < ymin) code |= TOP;
    else if (y > ymax) code |= BOTTOM;
    return code;
}

// Cohen-Sutherland line clipping algorithm
void cohenSutherland(int x1, int y1, int x2, int y2)
{
    int code1 = computeCode(x1, y1);
    int code2 = computeCode(x2, y2);
    bool accept = false;

    while (true)
    {
        if ((code1 | code2) == 0)
        {
            // Both inside: trivially accept
            accept = true;
            break;
        }
        else if (code1 & code2)
        {
            // Both outside same region: trivially reject
            break;
        }
        else
        {
            // Partially inside: clip at boundary
            int codeOut = code1 ? code1 : code2;
            int x, y;

            if (codeOut & TOP)
            {
                x = x1 + (x2 - x1) * (ymin - y1) / (y2 - y1);
                y = ymin;
            }
            else if (codeOut & BOTTOM)
            {
                x = x1 + (x2 - x1) * (ymax - y1) / (y2 - y1);
                y = ymax;
            }
            else if (codeOut & RIGHT)
            {
                y = y1 + (y2 - y1) * (xmax - x1) / (x2 - x1);
                x = xmax;
            }
            else
            {
                y = y1 + (y2 - y1) * (xmin - x1) / (x2 - x1);
                x = xmin;
            }

            // Replace the outside point
            if (codeOut == code1)
            {
                x1 = x;
                y1 = y;
                code1 = computeCode(x1, y1);
            }
            else
            {
                x2 = x;
                y2 = y;
                code2 = computeCode(x2, y2);
            }
        }
    }

    if (accept)
    {
        // Draw clipped line in green
        setcolor(GREEN);
        line(x1, y1, x2, y2);
    }
}

int main()
{
    int gd = DETECT, gm;
    initgraph(&gd, &gm, "");

    cout << "Enter clipping window (xmin ymin xmax ymax): ";
    cin >> xmin >> ymin >> xmax >> ymax;

    int x1, y1, x2, y2;
    cout << "Enter line endpoints (x1 y1 x2 y2): ";
    cin >> x1 >> y1 >> x2 >> y2;

    outtextxy(10, 10, (char*)"Cohen-Sutherland Line Clipping");

    // Draw clipping window in white
    setcolor(WHITE);
    rectangle(xmin, ymin, xmax, ymax);
    outtextxy(xmin, ymin - 15, (char*)"Clipping Window");

    // Draw original line in red (dashed appearance)
    setcolor(RED);
    setlinestyle(DASHED_LINE, 0, 1);
    line(x1, y1, x2, y2);
    outtextxy(x1 - 10, y1 - 15, (char*)"P1");
    outtextxy(x2 + 5, y2 + 5, (char*)"P2");
    setlinestyle(SOLID_LINE, 0, 1);

    // Draw clipped line in green
    cohenSutherland(x1, y1, x2, y2);

    outtextxy(10, getmaxy() - 30, (char*)"Red = Original | Green = Clipped");

    getch();
    closegraph();
    return 0;
}
