#include <graphics.h>
#include <conio.h>
#include <math.h>
#include <iostream>
using namespace std;

// Draw a triangle given 3 vertices
void drawTriangle(int x[], int y[], int color)
{
    setcolor(color);
    line(x[0], y[0], x[1], y[1]);
    line(x[1], y[1], x[2], y[2]);
    line(x[2], y[2], x[0], y[0]);
}

int main()
{
    int gd = DETECT, gm;
    initgraph(&gd, &gm, "");

    int x[3], y[3];
    int tx, ty, px, py;
    float sx, sy, angle;

    cout << "Enter 3 vertices of triangle (x y):" << endl;
    for (int i = 0; i < 3; i++)
    {
        cout << "Vertex " << i + 1 << ": ";
        cin >> x[i] >> y[i];
    }

    cout << "Translation (tx ty): ";
    cin >> tx >> ty;
    cout << "Scaling factors (sx sy): ";
    cin >> sx >> sy;
    cout << "Rotation angle (degrees): ";
    cin >> angle;
    cout << "Pivot point (px py): ";
    cin >> px >> py;

    outtextxy(10, 10, (char*)"2D Composite Transformations");

    // Step 1: Draw original (white)
    outtextxy(x[0], y[0] - 15, (char*)"Original");
    drawTriangle(x, y, WHITE);

    // Step 2: Translation (yellow)
    int tx1[3], ty1[3];
    for (int i = 0; i < 3; i++)
    {
        tx1[i] = x[i] + tx;
        ty1[i] = y[i] + ty;
    }
    outtextxy(tx1[0], ty1[0] - 15, (char*)"Translated");
    drawTriangle(tx1, ty1, YELLOW);

    // Step 3: Scaling about pivot (cyan)
    int sx1[3], sy1[3];
    for (int i = 0; i < 3; i++)
    {
        sx1[i] = (int)(tx1[i] * sx + px * (1 - sx));
        sy1[i] = (int)(ty1[i] * sy + py * (1 - sy));
    }
    outtextxy(sx1[0], sy1[0] - 15, (char*)"Scaled");
    drawTriangle(sx1, sy1, CYAN);

    // Step 4: Rotation about pivot (green)
    float rad = angle * M_PI / 180.0;
    int rx1[3], ry1[3];
    for (int i = 0; i < 3; i++)
    {
        rx1[i] = px + (int)((sx1[i] - px) * cos(rad) - (sy1[i] - py) * sin(rad));
        ry1[i] = py + (int)((sx1[i] - px) * sin(rad) + (sy1[i] - py) * cos(rad));
    }
    outtextxy(rx1[0], ry1[0] - 15, (char*)"Rotated");
    drawTriangle(rx1, ry1, GREEN);

    // Mark pivot
    setcolor(RED);
    circle(px, py, 4);

    getch();
    closegraph();
    return 0;
}
